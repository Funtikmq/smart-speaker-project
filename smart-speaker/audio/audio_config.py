# ─── Microfon fizic (INMP441 I2S via Google Voice HAT) ───────────────────────
MIC_DEVICE      = 1          # hw:1,0 — Google Voice HAT
MIC_SAMPLE_RATE = 48000      # frecvența nativă a microfonului
MIC_BLOCKSIZE   = 1024       # samples per callback sounddevice
MIC_BOOST       = 5          # amplificare software (același ca în testul tău)

# ─── Audio procesat (spre server și WAV) ─────────────────────────────────────
SAMPLE_RATE        = 16000   # după resample — ce primește serverul și aplicatia
AUDIO_CHANNELS     = 2       # stereo (duplicat L=R pentru compatibilitate)
SAMPLE_WIDTH_BYTES = 2       # int16 = 2 bytes

# ─── Chunks ───────────────────────────────────────────────────────────────────
AUDIO_CHUNK_SIZE   = 640     # samples int16 per chunk spre server
RECORDER_QUEUE_SIZE = 64
PLAYER_QUEUE_SIZE   = 64

# ─── Player ───────────────────────────────────────────────────────────────────
PLAYBACK_DEVICE = "plug:default"   # Google Voice HAT output

# ─── VAD (Voice Activity Detection) ──────────────────────────────────────────
# Ajustează VAD_RMS_THRESHOLD în funcție de zgomotul de fond:
#   - cameră liniștită: 200–400
#   - cameră normală:   400–800
VAD_RMS_THRESHOLD = 300      # sub acest RMS = silențiu
VAD_SILENCE_FRAMES = 140      # 3s de silențiu = stop înregistrare
VAD_MIN_RECORD_SECONDS = 1.2 # ignoră stop-ul pe silențiu în primele 1.2 secunde

# ─── Fișiere ──────────────────────────────────────────────────────────────────
REC_FILE = "recorded_audio.wav"

# ─── Wake Word (Porcupine) ────────────────────────────────────────────────────
PORCUPINE_ACCESS_KEY     = "g6IhOMSxrvuexAz7NOGSUBG8DejqrWcJ3BSb1tmcRTGUlDOtdRroLg=="
PORCUPINE_MODEL_PATH     = "/home/funtikmq/smart-speaker/wake_word/Vitola.ppn"
PORCUPINE_LANGUAGE_MODEL = "/home/funtikmq/smart-speaker/wake_word/porcupine_params_es.pv"
PORCUPINE_SENSITIVITY    = 0.8