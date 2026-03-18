import whisper
import numpy as np
import struct
import logging
import scipy.signal as signal

import config

logger = logging.getLogger(__name__)

logger.info(f"Se încarcă modelul Whisper '{config.WHISPER_MODEL}'...")
_model = whisper.load_model(config.WHISPER_MODEL)
logger.info("Model Whisper încărcat!")


def pcm_to_float(pcm_bytes: bytes) -> np.ndarray:
    """Convertește bytes PCM16 în float32 normalizat și resamplează la 16kHz."""
    samples = struct.unpack("<{}h".format(len(pcm_bytes) // 2), pcm_bytes)
    audio = np.array(samples, dtype=np.float32) / 32768.0
    audio = signal.resample(audio, int(len(audio) * config.WHISPER_SAMPLE_RATE / config.SAMPLE_RATE_PI))
    return audio


def transcribe(pcm_bytes: bytes) -> str:
    """Primește bytes PCM16 și returnează textul transcris."""
    audio = pcm_to_float(pcm_bytes)
    result = _model.transcribe(audio, language=config.STT_LANGUAGE, fp16=False)
    return result["text"].strip()