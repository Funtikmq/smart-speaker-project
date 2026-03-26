"""
SharedMicStream — un singur sd.InputStream deschis permanent.

Distribuie datele brute (48kHz, int32, mono) către toți consumatorii
înregistrați prin add_consumer() / remove_consumer().

Utilizare:
    mic = SharedMicStream()
    mic.add_consumer(wake_detector.feed)
    mic.add_consumer(recorder.feed)   # activ doar când recorder.running=True
    mic.start()
    ...
    mic.stop()
"""

import threading
import logging
import numpy as np
import sounddevice as sd

from .audio_config import MIC_DEVICE, MIC_SAMPLE_RATE, MIC_BLOCKSIZE

logger = logging.getLogger(__name__)


class SharedMicStream:

    def __init__(
        self,
        device: int = MIC_DEVICE,
        sample_rate: int = MIC_SAMPLE_RATE,
        blocksize: int = MIC_BLOCKSIZE,
    ):
        self.device = device
        self.sample_rate = sample_rate
        self.blocksize = blocksize

        self._consumers: list[callable] = []
        self._lock = threading.Lock()
        self._stream: sd.InputStream | None = None

    # ─── Consumatori ──────────────────────────────────────────────────────────

    def add_consumer(self, fn: callable):
        """Înregistrează un callback care primește np.ndarray (N,1) int32."""
        with self._lock:
            if fn not in self._consumers:
                self._consumers.append(fn)

    def remove_consumer(self, fn: callable):
        with self._lock:
            self._consumers = [c for c in self._consumers if c != fn]

    # ─── Stream ───────────────────────────────────────────────────────────────

    def _callback(self, indata: np.ndarray, frames: int, time_info, status):
        if status:
            logger.warning(f"MicStream status: {status}")
        # Copie pentru a evita probleme de concurență
        data = indata.copy()
        with self._lock:
            consumers = list(self._consumers)
        for fn in consumers:
            try:
                fn(data)
            except Exception as e:
                logger.error(f"Eroare consumer microfon: {e}")

    def start(self):
        if self._stream:
            return
        logger.info(f"SharedMicStream pornit (device={self.device}, {self.sample_rate}Hz, blocksize={self.blocksize})")
        self._stream = sd.InputStream(
            device=self.device,
            channels=1,
            samplerate=self.sample_rate,
            dtype="int32",
            blocksize=self.blocksize,
            callback=self._callback,
        )
        self._stream.start()

    def stop(self):
        if not self._stream:
            return
        self._stream.stop()
        self._stream.close()
        self._stream = None
        logger.info("SharedMicStream oprit.")