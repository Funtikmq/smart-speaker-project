import pvporcupine
import struct
import threading
import logging

from .audio_config import (
    PORCUPINE_ACCESS_KEY,
    PORCUPINE_MODEL_PATH,
    PORCUPINE_LANGUAGE_MODEL,
    PORCUPINE_SENSITIVITY,
)

logger = logging.getLogger(__name__)


class WakeWordDetector:
    """
    Ascultă continuu audio de la AudioRecorder și detectează wake word-ul
    folosind Porcupine de la Picovoice.

    Optimizat pentru microfon digital I2S (ex: INMP441, SPH0645)
    care produce nativ 16000 Hz mono — exact ce necesită Porcupine.
    """

    def __init__(
        self,
        access_key=PORCUPINE_ACCESS_KEY,
        model_path=PORCUPINE_MODEL_PATH,
        on_detected=None,
        sensitivity=PORCUPINE_SENSITIVITY,
        porcupine_model_path=PORCUPINE_LANGUAGE_MODEL,
    ):
        
        self.on_detected = on_detected
        self.running = False
        self.thread = None
        self._recorder = None

        logger.info("Se încarcă modelul Porcupine...")

        kwargs = dict(
            access_key=access_key,
            keyword_paths=[model_path],
            sensitivities=[sensitivity],
        )

        if porcupine_model_path:
            kwargs["model_path"] = porcupine_model_path

        self.porcupine = pvporcupine.create(**kwargs)
        logger.info(f"Porcupine încărcat! Frame length: {self.porcupine.frame_length}, Sample rate: {self.porcupine.sample_rate}")

    def start(self, recorder):
        """Pornește detecția — primește chunks de la AudioRecorder."""
        if self.running:
            return

        self._recorder = recorder
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        logger.info("Wake word detector pornit. Ascult...")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
            self.thread = None
        self.porcupine.delete()

    def _loop(self):
        """
        Porcupine necesită exact frame_length samples (512) per procesare.
        Microfonul I2S produce nativ 16000 Hz mono — fără resample necesar.
        """
        buffer = []
        frame_length = self.porcupine.frame_length  # 512 samples

        while self.running:
            chunk = self._recorder.get_chunk(timeout=0.1)
            if not chunk:
                continue

            # Convertește PCM16 bytes în listă de int16
            num_samples = len(chunk) // 2
            samples = list(struct.unpack(f"<{num_samples}h", chunk))

            buffer.extend(samples)

            # Procesează câte un frame de 512 samples
            while len(buffer) >= frame_length:
                frame = buffer[:frame_length]
                buffer = buffer[frame_length:]

                result = self.porcupine.process(frame)
                if result >= 0:
                    logger.info("Wake word detectat!")
                    if self.on_detected:
                        self.on_detected()