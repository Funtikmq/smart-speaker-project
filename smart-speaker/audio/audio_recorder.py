"""
AudioRecorder — INMP441 I2S via Google Voice HAT (sounddevice)

Flow intern:
  sounddevice callback (48kHz, S32, mono)
      │
      ├─► boost + resample 48k→16k + PCM16
      │       │
      │       ├─► queue (chunks PCM16 spre server)
      │       └─► buffer complet (pentru save_wav)
      │
      └─► VAD (energie RMS) — setează _silence_detected când e liniște

AudioRecorder este pasiv — nu pornește stream-ul propriu.
Stream-ul este deținut de SharedMicStream și callback-ul
recorderului este înregistrat acolo.
"""

import wave
import queue
import logging
import numpy as np

from .audio_config import (
    AUDIO_CHUNK_SIZE,
    RECORDER_QUEUE_SIZE,
    SAMPLE_RATE,          # 16000 — sample rate de ieșire spre server
    AUDIO_CHANNELS,
    SAMPLE_WIDTH_BYTES,
    MIC_SAMPLE_RATE,      # 48000 — sample rate fizic al microfonului
    MIC_BOOST,            # factor amplificare software
    VAD_RMS_THRESHOLD,    # prag energie pentru silențiu
    VAD_SILENCE_FRAMES,   # câte frame-uri consecutive sub prag = silențiu
    VAD_MIN_RECORD_SECONDS,
    REC_FILE,
)

logger = logging.getLogger(__name__)


# ─── Resample simplu cu numpy (linear interpolation) ─────────────────────────

def _resample(audio_f32: np.ndarray, orig_fs: int, target_fs: int) -> np.ndarray:
    if orig_fs == target_fs:
        return audio_f32
    # Fast-path pentru rapoarte întregi (ex: 48k -> 16k) pe hardware slab.
    if orig_fs % target_fs == 0:
        step = orig_fs // target_fs
        return audio_f32[::step].astype(np.float32, copy=False)
    duration = len(audio_f32) / orig_fs
    orig_idx = np.linspace(0, duration, len(audio_f32))
    new_idx = np.linspace(0, duration, int(duration * target_fs))
    return np.interp(new_idx, orig_idx, audio_f32).astype(np.float32)


# ─── AudioRecorder ────────────────────────────────────────────────────────────

class AudioRecorder:
    """
    Colectează audio de la SharedMicStream când este activ (running=True).

    Folosit de Assistant astfel:
        recorder.start()          # activează colectarea
        ...
        recorder.stop()           # dezactivează; calculează sample rate real
        recorder.save_wav(path)   # opțional
    """

    def __init__(
        self,
        chunk_size: int = AUDIO_CHUNK_SIZE,
        max_queue_size: int = RECORDER_QUEUE_SIZE,
    ):
        self.chunk_size = chunk_size
        self.chunk_bytes = chunk_size * SAMPLE_WIDTH_BYTES
        self.running = False

        self.queue: queue.Queue[bytes] = queue.Queue(maxsize=max_queue_size)

        # Buffer intern bytes PCM16 pentru asamblare chunk-uri.
        self._pcm_buffer = bytearray()

        # Toate sample-urile înregistrate (PCM16 bytes) — pentru save_wav.
        self._all_samples = bytearray()

        # VAD
        self._silence_counter = 0
        self._silence_detected = False
        self._frames_seen = 0
        self.on_silence: callable = None   # callback setat de Assistant

    # ─── Activare / dezactivare ───────────────────────────────────────────────

    def start(self):
        """Activează colectarea audio. Apelat după sunetul de confirmare."""
        self._pcm_buffer.clear()
        self._all_samples.clear()
        self._silence_counter = 0
        self._silence_detected = False
        self._frames_seen = 0
        self.running = True
        logger.info("AudioRecorder activ — înregistrare...")

    def stop(self):
        """Dezactivează colectarea. SharedMicStream rămâne deschis."""
        self.running = False
        logger.info("AudioRecorder oprit.")

    # ─── Callback apelat de SharedMicStream ──────────────────────────────────

    def feed(self, indata: np.ndarray):
        """
        Primește un bloc raw de la microfon (48kHz, int32, mono).
        Apelat din callback-ul sounddevice — trebuie să fie rapid.
        """
        if not self.running:
            return

        # S32 → float32 [-1, 1]
        audio_f32 = (indata[:, 0] / 2**31).astype(np.float32)

        # Boost software
        audio_f32 = np.clip(audio_f32 * MIC_BOOST, -1.0, 1.0)

        # Resample 48kHz → 16kHz
        audio_16k = _resample(audio_f32, MIC_SAMPLE_RATE, SAMPLE_RATE)

        # float32 → int16
        samples_i16 = np.clip(audio_16k * 32767, -32768, 32767).astype(np.int16)

        # VAD — calculează RMS pe blocul curent
        self._frames_seen += 1
        min_frames_before_stop = int((VAD_MIN_RECORD_SECONDS * MIC_SAMPLE_RATE) / len(indata))

        rms = float(np.sqrt(np.mean(samples_i16.astype(np.float32) ** 2)))
        if rms < VAD_RMS_THRESHOLD:
            self._silence_counter += 1
        else:
            self._silence_counter = 0

        if (
            self._frames_seen >= min_frames_before_stop
            and self._silence_counter >= VAD_SILENCE_FRAMES
            and not self._silence_detected
        ):
            self._silence_detected = True
            logger.info(f"VAD: silențiu detectat (RMS={rms:.1f})")
            if self.on_silence:
                self.on_silence()

        # Lucrăm direct pe bytes pentru a evita conversii costisitoare în callback.
        pcm_bytes = samples_i16.tobytes()
        self._pcm_buffer.extend(pcm_bytes)
        self._all_samples.extend(pcm_bytes)

        # Emite chunks complete în queue.
        while len(self._pcm_buffer) >= self.chunk_bytes:
            frame = bytes(self._pcm_buffer[:self.chunk_bytes])
            del self._pcm_buffer[:self.chunk_bytes]
            self._enqueue(frame)

    # ─── Queue ────────────────────────────────────────────────────────────────

    def _enqueue(self, chunk: bytes):
        if self.queue.full():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                pass
        self.queue.put_nowait(chunk)

    def get_chunk(self, timeout: float = None) -> bytes | None:
        try:
            return self.queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def drain_queue(self):
        """Golește queue-ul fără să returneze nimic."""
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                break

    # ─── Save WAV ─────────────────────────────────────────────────────────────

    def save_wav(self, filename: str = REC_FILE) -> str | None:
        if not self._all_samples:
            logger.warning("Nicio înregistrare de salvat.")
            return None

        samples = np.frombuffer(self._all_samples, dtype=np.int16)
        stereo = np.repeat(samples[:, None], 2, axis=1).reshape(-1)

        with wave.open(filename, "w") as wf:
            wf.setnchannels(AUDIO_CHANNELS)
            wf.setsampwidth(SAMPLE_WIDTH_BYTES)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(stereo.astype(np.int16, copy=False).tobytes())

        logger.info(f"WAV salvat: {filename} ({len(samples)} samples @ {SAMPLE_RATE}Hz)")
        return filename