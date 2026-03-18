# ─── SPI ──────────────────────────────────────────────────────────────────────
SPI_BUS = 0
SPI_DEVICE = 0
SPI_SPEED_HZ = 1000000

# ─── Audio ────────────────────────────────────────────────────────────────────
AUDIO_CHANNELS = 2
SAMPLE_WIDTH_BYTES = 2
SAMPLE_RATE = 16000
AUDIO_CHUNK_SIZE = 640
RECORDER_QUEUE_SIZE = 64
PLAYER_QUEUE_SIZE = 64
PLAYBACK_DEVICE = "plug:default"
REC_FILE = "recorded_audio.wav"

# ─── Wake Word ────────────────────────────────────────────────────────────────
PORCUPINE_ACCESS_KEY = "g6IhOMSxrvuexAz7NOGSUBG8DejqrWcJ3BSb1tmcRTGUlDOtdRroLg=="
PORCUPINE_MODEL_PATH = "/home/funtikmq/smart-speaker/Vitola.ppn"
PORCUPINE_LANGUAGE_MODEL = "/home/funtikmq/smart-speaker/porcupine_params_es.pv"
PORCUPINE_SENSITIVITY = 0.8