# ─── Microfon fizic (INMP441 I2S via Google Voice HAT) ───────────────────────
MIC_DEVICE      = 1          # hw:1,0 — Google Voice HAT
MIC_SAMPLE_RATE = 48000      # frecvența nativă a microfonului
MIC_BLOCKSIZE   = 2048       # mai puține callback-uri => overhead CPU mai mic pe Pi Zero
MIC_BOOST       = 5          # amplificare software (același ca în testul tău)

# ─── Audio procesat (spre server și WAV) ─────────────────────────────────────
SAMPLE_RATE        = 16000   # după resample — ce primește serverul și aplicatia
AUDIO_CHANNELS     = 2       # stereo (duplicat L=R pentru compatibilitate)
SAMPLE_WIDTH_BYTES = 2       # int16 = 2 bytes

# ─── Chunks ───────────────────────────────────────────────────────────────────
AUDIO_CHUNK_SIZE   = 1280    # mai puține trimiteri websocket, fără latență mare
RECORDER_QUEUE_SIZE = 64
PLAYER_QUEUE_SIZE   = 64

# ─── Player ───────────────────────────────────────────────────────────────────
PLAYBACK_DEVICE = "plug:default"   # Google Voice HAT output

# ─── VAD (Voice Activity Detection) ──────────────────────────────────────────
# VAD Adaptiv: se calibrează automat pe baza zgomotului de fond
#   - În primele VAD_CALIBRATION_FRAMES, calculează zgomotul de fond
#   - Pragul dinamic = noise_floor * VAD_THRESHOLD_MULTIPLIER
#   - Pentru zgomot mai mare: creștiți VAD_THRESHOLD_MULTIPLIER

VAD_RMS_THRESHOLD = 300      # prag inițial (ajustare manuală)
VAD_SILENCE_FRAMES = 70       # ~3s la MIC_BLOCKSIZE=2048 — cadre consecutive sub prag
VAD_MIN_RECORD_SECONDS = 1.2  # ignoră stop-ul pe silențiu în primele 1.2 secunde
VAD_MAX_RECORD_SECONDS = 20.0 # safety cap: oprește înregistrarea dacă VAD nu declanșează

# ─── VAD Adaptiv (calibrare dinamică la zgomot) ──────────────────────────────
VAD_ADAPTIVE_MODE = True       # activează detecția dinamică
VAD_CALIBRATION_FRAMES = 10    # primele 10 frame-uri pentru estimare zgomot
VAD_THRESHOLD_MULTIPLIER = 1.8 # prag = noise_floor * multiplicator (1.3-2.0 în zgomot)
VAD_NOISE_GATE_DB = -40        # filtrează componente sub -40dB din spectru

# ─── Fișiere ──────────────────────────────────────────────────────────────────
REC_FILE = "recorded_audio.wav"

# ─── Wake Word (Porcupine) ────────────────────────────────────────────────────
PORCUPINE_ACCESS_KEY     = "g6IhOMSxrvuexAz7NOGSUBG8DejqrWcJ3BSb1tmcRTGUlDOtdRroLg=="
PORCUPINE_MODEL_PATH     = "/home/funtikmq/smart-speaker/wake_word/Vitola.ppn"
PORCUPINE_LANGUAGE_MODEL = "/home/funtikmq/smart-speaker/wake_word/porcupine_params_es.pv"
PORCUPINE_SENSITIVITY    = 0.8