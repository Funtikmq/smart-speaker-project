"""
WakeWordDetector — Porcupine pe SharedMicStream (48kHz → 16kHz, boost).

Nu pornește propriul stream. Primește date prin feed() înregistrat
ca consumer la SharedMicStream.
"""

import logging
import numpy as np
import pvporcupine

from audio.audio_config import (
    PORCUPINE_ACCESS_KEY,
    PORCUPINE_MODEL_PATH,
    PORCUPINE_LANGUAGE_MODEL,
    PORCUPINE_SENSITIVITY,
    MIC_SAMPLE_RATE,
    MIC_BOOST,
    SAMPLE_RATE,
)

logger = logging.getLogger(__name__)


def _resample(audio_f32: np.ndarray, orig_fs: int, target_fs: int) -> np.ndarray:
    if orig_fs == target_fs:
        return audio_f32
    # Fast-path pentru rapoarte întregi (ex: 48k -> 16k).
    if orig_fs % target_fs == 0:
        step = orig_fs // target_fs
        return audio_f32[::step].astype(np.float32, copy=False)
    duration = len(audio_f32) / orig_fs
    orig_idx = np.linspace(0, duration, len(audio_f32))
    new_idx = np.linspace(0, duration, int(duration * target_fs))
    return np.interp(new_idx, orig_idx, audio_f32).astype(np.float32)


class WakeWordDetector:
    """
    Ascultă continuu prin SharedMicStream și apelează on_detected()
    când wake word-ul este recunoscut.

    Utilizare:
        detector = WakeWordDetector(on_detected=callback)
        mic.add_consumer(detector.feed)
        detector.start()
        ...
        detector.stop()
        mic.remove_consumer(detector.feed)
    """

    def __init__(self, on_detected: callable = None):
        self.on_detected = on_detected
        self.running = False
        self._buffer = bytearray()

        logger.info("Se încarcă modelul Porcupine...")
        self.porcupine = pvporcupine.create(
            access_key=PORCUPINE_ACCESS_KEY,
            keyword_paths=[PORCUPINE_MODEL_PATH],
            sensitivities=[PORCUPINE_SENSITIVITY],
            model_path=PORCUPINE_LANGUAGE_MODEL,
        )
        self._frame_length = self.porcupine.frame_length  # 512 samples @ 16kHz
        self._frame_bytes = self._frame_length * 2
        logger.info(
            f"Porcupine gata — frame_length={self._frame_length}, "
            f"sample_rate={self.porcupine.sample_rate}"
        )

    # ─── Lifecycle ────────────────────────────────────────────────────────────

    def start(self):
        self.running = True
        self._buffer.clear()
        logger.info("WakeWordDetector activ — ascult...")

    def stop(self):
        self.running = False
        self.porcupine.delete()
        logger.info("WakeWordDetector oprit.")

    # ─── Feed (apelat de SharedMicStream) ────────────────────────────────────

    def feed(self, indata: np.ndarray):
        """
        Primește bloc raw 48kHz int32 mono.
        Aplică boost, resample la 16kHz, procesează cu Porcupine.
        """
        if not self.running:
            return

        # S32 → float32
        audio_f32 = (indata[:, 0] / 2**31).astype(np.float32)

        # Boost
        audio_f32 = np.clip(audio_f32 * MIC_BOOST, -1.0, 1.0)

        # Resample 48kHz → 16kHz
        audio_16k = _resample(audio_f32, MIC_SAMPLE_RATE, SAMPLE_RATE)

        # float32 → int16
        samples_i16 = np.clip(audio_16k * 32767, -32768, 32767).astype(np.int16)
        self._buffer.extend(samples_i16.tobytes())

        # Procesează câte un frame Porcupine (512 samples)
        while len(self._buffer) >= self._frame_bytes:
            frame_bytes = bytes(self._buffer[:self._frame_bytes])
            del self._buffer[:self._frame_bytes]
            frame = np.frombuffer(frame_bytes, dtype=np.int16)

            result = self.porcupine.process(frame)
            if result >= 0:
                logger.info("🎤 Wake word detectat!")
                if self.on_detected:
                    self.on_detected()