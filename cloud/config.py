# ─── Server ───────────────────────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 8765

# ─── STT ──────────────────────────────────────────────────────────────────────
WHISPER_MODEL = "small"

# Pi trimite acum 16kHz PCM16 (după resample pe Pi cu INMP441 I2S)
# Whisper necesită tot 16kHz → resample_ratio = 1 (nu mai e nevoie de resample)
SAMPLE_RATE_PI      = 16000
WHISPER_SAMPLE_RATE = 16000

STT_LANGUAGE = "en"

# ─── TTS ──────────────────────────────────────────────────────────────────────
TTS_LANGUAGE = "en"
TTS_OUTPUT_FORMAT = "wav"      # "wav" reduce CPU pe Pi la redare
TTS_OUTPUT_SAMPLE_RATE = 16000

# ─── AI ───────────────────────────────────────────────────────────────────────
import os

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-opus-4-7"
CLAUDE_MAX_TOKENS = 128
CLAUDE_MAX_CHARS = 400
CLAUDE_LANGUAGE = "en"
CLAUDE_SYSTEM_PROMPT = """You are a helpful voice assistant.
Keep responses short and clear for audio playback.
Avoid long lists and markdown formatting. Respond in English."""

# ─── Logging ──────────────────────────────────────────────────────────────────
LOG_LEVEL = "INFO"