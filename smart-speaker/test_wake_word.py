import pvporcupine
import sounddevice as sd
import numpy as np
import threading
import logging

# Config Porcupine
PORCUPINE_ACCESS_KEY = "g6IhOMSxrvuexAz7NOGSUBG8DejqrWcJ3BSb1tmcRTGUlDOtdRroLg=="
PORCUPINE_MODEL_PATH = "/home/funtikmq/smart-speaker/wake_word/Vitola.ppn"
PORCUPINE_LANGUAGE_MODEL = "/home/funtikmq/smart-speaker/wake_word/porcupine_params_es.pv"
PORCUPINE_SENSITIVITY = 0.8

# Microfon I2S
MIC_DEVICE = 1       # hw:1,0
MIC_CHANNELS = 1
MIC_FS = 48000       # S32_LE 48kHz
BOOST = 5            # boost software x5

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def resample_numpy(audio, target_fs, orig_fs):
    """Resample audio cu numpy (linear interpolation)"""
    duration = len(audio) / orig_fs
    target_len = int(duration * target_fs)
    old_idx = np.linspace(0, duration, len(audio))
    new_idx = np.linspace(0, duration, target_len)
    return np.interp(new_idx, old_idx, audio).astype(np.float32)


class WakeWordRealtime:
    def __init__(self):
        self.running = False
        self.porcupine = pvporcupine.create(
            access_key=PORCUPINE_ACCESS_KEY,
            keyword_paths=[PORCUPINE_MODEL_PATH],
            sensitivities=[PORCUPINE_SENSITIVITY],
            model_path=PORCUPINE_LANGUAGE_MODEL
        )
        self.frame_length = self.porcupine.frame_length
        self.sample_rate = self.porcupine.sample_rate  # 16kHz
        self.buffer = []

    def audio_callback(self, indata, frames, time, status):
        if status:
            print(status)
        # Convert S32_LE -> float32 [-1,1]
        audio = (indata[:, 0] / 2**31).astype(np.float32)
        # Boost software
        audio *= BOOST
        audio = np.clip(audio, -1, 1)
        # Resample 48kHz -> 16kHz
        audio16k = resample_numpy(audio, self.sample_rate, MIC_FS)
        # Convert float32 -> int16
        audio16k_int16 = np.clip(audio16k * 32767, -32768, 32767).astype(np.int16)
        self.buffer.extend(audio16k_int16.tolist())

        # Proceseaza frame-uri Porcupine
        while len(self.buffer) >= self.frame_length:
            frame = self.buffer[:self.frame_length]
            self.buffer = self.buffer[self.frame_length:]
            result = self.porcupine.process(frame)
            if result >= 0:
                print("Wake word detectat!")

    def start(self):
        self.running = True
        with sd.InputStream(channels=MIC_CHANNELS,
                            samplerate=MIC_FS,
                            dtype='int32',
                            device=MIC_DEVICE,
                            blocksize=1024,
                            callback=self.audio_callback):
            print("Wake word realtime pornit. Vorbeste acum...")
            while self.running:
                sd.sleep(1000)

    def stop(self):
        self.running = False
        self.porcupine.delete()


if __name__ == "__main__":
    detector = WakeWordRealtime()
    try:
        detector.start()
    except KeyboardInterrupt:
        detector.stop()
        print("Test wake word oprit.")