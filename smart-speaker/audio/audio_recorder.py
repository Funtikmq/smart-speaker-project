import spidev
import wave
import struct
import time
import threading
import queue

from .audio_config import (
    SPI_BUS, SPI_DEVICE, SPI_SPEED_HZ,
    AUDIO_CHANNELS, SAMPLE_WIDTH_BYTES,
    AUDIO_CHUNK_SIZE, RECORDER_QUEUE_SIZE,
    REC_FILE,
)

spi = spidev.SpiDev()
spi.open(SPI_BUS, SPI_DEVICE)
spi.max_speed_hz = SPI_SPEED_HZ


def read_sample():
    """Citește un sample de la MCP3201 prin SPI."""
    adc = spi.xfer2([0x00, 0x00])
    value = ((adc[0] & 0x1F) << 7) | (adc[1] >> 1)
    sample = (value - 2048) * 16

    if sample > 32767:
        sample = 32767
    if sample < -32768:
        sample = -32768

    return sample


def close():
    spi.close()


class AudioRecorder:

    def __init__(self, chunk_size=AUDIO_CHUNK_SIZE, max_queue_size=RECORDER_QUEUE_SIZE):
        self.chunk_size = chunk_size
        self.running = False
        self.thread = None
        self.buffer = []
        self.queue = queue.Queue(maxsize=max_queue_size)

        # sample rate detectat real după înregistrare
        self.detected_sample_rate = None
        self._samples = []
        self._start_time = None

    # ─── Queue ────────────────────────────────────────────────────────────────

    def _enqueue_chunk(self, chunk):
        if self.queue.full():
            try:
                self.queue.get_nowait()
            except queue.Empty:
                pass
        self.queue.put_nowait(chunk)

    # ─── Loop ─────────────────────────────────────────────────────────────────

    def _loop(self):
        self._start_time = time.time()
        self._samples = []

        while self.running:
            sample = read_sample()
            self._samples.append(sample)
            self.buffer.append(sample)

            if len(self.buffer) >= self.chunk_size:
                frame = self.buffer[:self.chunk_size]
                del self.buffer[:self.chunk_size]
                pcm_chunk = struct.pack("<{}h".format(len(frame)), *frame)
                self._enqueue_chunk(pcm_chunk)

        # calculează sample rate real
        duration = time.time() - self._start_time
        if duration > 0:
            self.detected_sample_rate = int(len(self._samples) / duration)

    # ─── Public API ───────────────────────────────────────────────────────────

    def start(self):
        if self.running:
            return
        self.running = True
        self.buffer = []
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
            self.thread = None

    def get_chunk(self, timeout=None):
        try:
            return self.queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def save_wav(self, filename=REC_FILE):
        """
        Salveaza înregistrarea ca fișier WAV folosind
        sample rate-ul real detectat — exact ca versiunea originală.
        """
        if not self._samples:
            print("Nicio înregistrare de salvat.")
            return None

        sample_rate = self.detected_sample_rate or 16000
        print(f"Sample rate real detectat: {sample_rate} Hz")

        wf = wave.open(filename, 'w')
        wf.setnchannels(AUDIO_CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH_BYTES)
        wf.setframerate(sample_rate)

        for s in self._samples:
            data = struct.pack('<hh', s, s)  # stereo (duplicat pe ambele canale)
            wf.writeframesraw(data)

        wf.close()
        print(f"Salvat în {filename}")
        return filename