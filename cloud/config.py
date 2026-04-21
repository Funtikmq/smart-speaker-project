# ─── Server ───────────────────────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 8765

# ─── STT ──────────────────────────────────────────────────────────────────────
WHISPER_MODEL = "small"

# Pi trimite acum 16kHz PCM16 (după resample pe Pi cu INMP441 I2S)
# Whisper necesită tot 16kHz → resample_ratio = 1 (nu mai e nevoie de resample)
SAMPLE_RATE_PI      = 16000
WHISPER_SAMPLE_RATE = 16000

STT_LANGUAGE = "ro"

# ─── TTS ──────────────────────────────────────────────────────────────────────
TTS_LANGUAGE = "ro"
TTS_OUTPUT_FORMAT = "wav"      # "wav" reduce CPU pe Pi la redare
TTS_OUTPUT_SAMPLE_RATE = 16000

# ─── AI ───────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = "g6IhOMSxrvuexAz7NOGSUBG8DejqrWcJ3BSb1tmcRTGUlDOtdRroLg=="
CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_MAX_TOKENS = 1024
CLAUDE_SYSTEM_PROMPT = """Ești un asistent vocal inteligent.
Răspunsurile tale trebuie să fie concise și clare, potrivite pentru redare audio.
Evită listele lungi și formatarea markdown — vorbește natural."""

# ─── Logging ──────────────────────────────────────────────────────────────────
LOG_LEVEL = "INFO"