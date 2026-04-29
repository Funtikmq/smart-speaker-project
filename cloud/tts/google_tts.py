import io
import logging
import subprocess
from gtts import gTTS

import config

logger = logging.getLogger(__name__)


def _to_wav(mp3_bytes: bytes, sample_rate: int) -> bytes:
    """Convertește MP3 în WAV PCM16 mono folosind ffmpeg în cloud."""
    proc = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "mp3",
            "-i",
            "pipe:0",
            "-ac",
            "1",
            "-ar",
            str(sample_rate),
            "-f",
            "wav",
            "pipe:1",
        ],
        input=mp3_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return proc.stdout


def synthesize(text: str, lang: str = config.TTS_LANGUAGE) -> bytes:
    """Convertește text în audio; preferă WAV pentru redare mai ușoară pe Pi."""
    logger.info(f"Generare TTS pentru: '{text[:50]}...'")
    tts = gTTS(text=text, lang=lang, slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    mp3_bytes = buf.read()

    output_format = str(getattr(config, "TTS_OUTPUT_FORMAT", "mp3")).lower()
    if output_format != "wav":
        return mp3_bytes

    try:
        sample_rate = int(getattr(config, "TTS_OUTPUT_SAMPLE_RATE", 16000))
        wav_bytes = _to_wav(mp3_bytes, sample_rate)
        logger.info(f"TTS transcodare cloud: MP3 -> WAV ({sample_rate}Hz)")
        return wav_bytes
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError) as e:
        logger.warning(f"ffmpeg indisponibil sau eroare transcodare, fallback MP3: {e}")
        return mp3_bytes