import io
import logging
import subprocess
import struct
from gtts import gTTS

import config

logger = logging.getLogger(__name__)


def _to_wav(mp3_bytes: bytes, sample_rate: int) -> bytes:
    """Convertește MP3 în WAV PCM16 mono folosind ffmpeg în cloud."""
    proc = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "warning",
            "-f", "mp3",
            "-i", "pipe:0",
            "-ac", "1",                # mono
            "-ar", str(sample_rate),   # sample rate
            "-acodec", "pcm_s16le",    # 16-bit signed PCM, little-endian
            "-f", "wav",               # output format
            "pipe:1",
        ],
        input=mp3_bytes,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    wav_bytes = proc.stdout
    
    # Verifică header WAV
    if len(wav_bytes) >= 44:
        # RIFF header: bytes 0-3 = "RIFF", 4-7 = file size, 8-11 = "WAVE"
        if wav_bytes[0:4] == b"RIFF" and wav_bytes[8:12] == b"WAVE":
            # fmt chunk: 16 (AudioFormat), 1 (PCM), 2 (channels), 4 (sample rate)
            fmt_pos = 12
            if wav_bytes[fmt_pos:fmt_pos+4] == b"fmt ":
                channels = struct.unpack('<H', wav_bytes[fmt_pos+8:fmt_pos+10])[0]
                sr = struct.unpack('<I', wav_bytes[fmt_pos+12:fmt_pos+16])[0]
                logger.info(f"WAV header: channels={channels}, sample_rate={sr}Hz, size={len(wav_bytes)} bytes")
    
    return wav_bytes


def synthesize(text: str, lang: str = config.TTS_LANGUAGE) -> bytes:
    """Convertește text în audio MP3 folosind gTTS."""
    logger.info(f"Generare TTS pentru: '{text[:50]}...'")
    tts = gTTS(text=text, lang=lang, slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    mp3_bytes = buf.read()
    logger.info(f"gTTS generat MP3: {len(mp3_bytes)} bytes")

    output_format = str(getattr(config, "TTS_OUTPUT_FORMAT", "mp3")).lower()
    if output_format != "wav":
        return mp3_bytes

    try:
        sample_rate = int(getattr(config, "TTS_OUTPUT_SAMPLE_RATE", 16000))
        wav_bytes = _to_wav(mp3_bytes, sample_rate)
        logger.info(f"TTS transcodare cloud: MP3 -> WAV ({sample_rate}Hz), rezultat: {len(wav_bytes)} bytes")
        return wav_bytes
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError) as e:
        logger.warning(f"ffmpeg indisponibil sau eroare transcodare, fallback MP3: {e}")
        return mp3_bytes
