import io
import logging
from gtts import gTTS

import config

logger = logging.getLogger(__name__)


def synthesize(text: str, lang: str = config.TTS_LANGUAGE) -> bytes:
    """Convertește text în audio MP3 folosind gTTS."""
    logger.info(f"Generare TTS pentru: '{text[:50]}...'")
    tts = gTTS(text=text, lang=lang, slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return buf.read()