"""
Assistant — orchestrează întregul flow:

  1. SharedMicStream pornit permanent
  2. WakeWordDetector ascultă continuu
  3. Wake word detectat → sunet confirmare → AudioRecorder pornit
  4. VAD detectează silențiu → recorder oprit → audio trimis la server
  5. Server răspunde cu TTS → player redă → revenim la (2)
"""

import asyncio
import threading
import logging

from audio.audio_recorder import AudioRecorder
from audio.audio_player import AudioPlayer
from audio.shared_mic_stream import SharedMicStream
from wake_word.wake_word import WakeWordDetector
from core.router import Router, ConnectionState
from network.websocket_client import WebSocketClient
from network.bluetooth_client import BluetoothServer
from indicators.indicators import Indicator
import config

try:
    from cloud.tts.google_tts import synthesize as cloud_synthesize
except Exception:
    cloud_synthesize = None

logger = logging.getLogger(__name__)

RESPONSE_FILE = "/tmp/response.mp3"


class Assistant:

    def __init__(self):
        # Audio I/O
        self.mic    = SharedMicStream()
        self.recorder = AudioRecorder()
        self.player   = AudioPlayer()

        # Wake word
        self.detector = WakeWordDetector(on_detected=self._on_wake_word)

        # Rețea
        self.router    = Router()
        self.bt_server = BluetoothServer()

        # UI
        self.indicator = Indicator(sounds_dir=config.SOUNDS_DIR)

        # Stare internă
        self._loop: asyncio.AbstractEventLoop | None = None
        self._recording_done = threading.Event()

    # ─── Lifecycle ────────────────────────────────────────────────────────────

    async def start(self):
        # Capturăm loop-ul asyncio curent — necesar pentru run_coroutine_threadsafe
        self._loop = asyncio.get_running_loop()

        self.player.start()
        self.player.set_volume(90)

        # Înregistrăm consumatorii la stream-ul de microfon
        self.mic.add_consumer(self.detector.feed)
        self.mic.add_consumer(self.recorder.feed)  # recorder.feed ignoră datele când running=False

        # Pornim stream-ul fizic
        self.mic.start()

        # Pornim wake word detector
        self.detector.start()

        # Bluetooth
        if config.USE_BLUETOOTH:
            self.bt_server.start()

        logger.info("Assistant pornit — ascult wake word...")

    def stop(self):
        self.detector.stop()
        self.mic.stop()
        self.recorder.stop()
        self.player.stop()
        if config.USE_BLUETOOTH:
            self.bt_server.stop()
        logger.info("Assistant oprit.")

    # ─── Wake word callback ───────────────────────────────────────────────────

    def _on_wake_word(self):
        """
        Apelat din thread-ul callback-ului sounddevice.
        Nu blocăm — programăm corutina pe loop-ul asyncio.
        """
        if self.recorder.running:
            # Ignorăm dacă deja înregistrăm
            return
        logger.info("Wake word → lansez conversație")
        asyncio.run_coroutine_threadsafe(
            self.handle_conversation(), self._loop
        )

    # ─── Conversație ─────────────────────────────────────────────────────────

    async def handle_conversation(self):
        # Oprește temporar detecția wake word în timpul înregistrării
        self.detector.running = False

        # Sunet de confirmare — blochează până se termină
        self.indicator.listening()            # LED / sunet "ding"
        await asyncio.sleep(0.5)              # lasă sunetul să se audă complet

        try:
            state = await self.router.resolve()

            if state == ConnectionState.BLUETOOTH_CLOUD:
                logger.info("Rută: BLUETOOTH_CLOUD")
                await self._handle_bluetooth(use_cloud=True)

            elif state == ConnectionState.BLUETOOTH_SIMPLE:
                logger.info("Rută: BLUETOOTH_SIMPLE")
                await self._handle_bluetooth(use_cloud=False)

            elif state == ConnectionState.CLOUD_DIRECT:
                logger.info("Rută: CLOUD_DIRECT")
                await self._handle_cloud_direct()

            else:
                logger.warning("Nicio conexiune disponibilă")
                self.indicator.no_connection()

        finally:
            # Reactivăm wake word detector după ce am terminat
            self.recorder.stop()
            self.recorder.drain_queue()
            self.detector.running = True
            logger.info("Revenit la ascultare wake word...")

    # ─── Cloud direct ─────────────────────────────────────────────────────────

    async def _handle_cloud_direct(self):
        client = WebSocketClient(config.SERVER_URL)
        await client.connect()

        try:
            await self._record_and_send(
                send_fn=client.send_audio
            )

            await client.send_command({"type": "recording_stopped"})
            self.indicator.processing()

            data = await client.recv_json(timeout=30)
            if data.get("type") == "transcription":
                logger.info(f"Transcriere: {data['text']}")

            data = await client.recv_json(timeout=30)
            if data.get("type") == "response":
                logger.info(f"Răspuns: {data['text']}")

            audio_bytes = await client.recv_bytes(timeout=30)
            await self._play_response(audio_bytes)

        finally:
            await client.disconnect()

    # ─── Bluetooth ────────────────────────────────────────────────────────────

    async def _handle_bluetooth(self, use_cloud: bool):
        try:
            await self._record_and_send(
                send_fn=lambda chunk: self.bt_server.send_audio(chunk)
            )

            self.bt_server.send_command({
                "type": "recording_stopped",
                "use_cloud": use_cloud,
            })
            self.indicator.processing()

            # Încercăm să primim audio TTS de la telefon, dar nu stăm blocat.
            try:
                audio_bytes = await asyncio.wait_for(self.bt_server.recv_audio(), timeout=1.0)
                await self._play_response(audio_bytes)
            except asyncio.TimeoutError:
                logger.warning("Nu a venit TTS prin RFCOMM — nu mai așteptăm")
                # Dacă telefonul trimite în schimb un command JSON cu textul răspunsului,
                # putem genera TTS local ca fallback.
                try:
                    cmd = await asyncio.wait_for(self.bt_server.recv_command(), timeout=0.5)
                    text = cmd.get("text") or cmd.get("response") or None
                    if text and cloud_synthesize:
                        try:
                            audio_bytes = cloud_synthesize(text)
                            await self._play_response(audio_bytes)
                        except Exception as e:
                            logger.warning(f"Local TTS eșuat: {e}")
                    else:
                        logger.info("Niciun text de răspuns primit de la telefon; sar peste redare.")
                except asyncio.TimeoutError:
                    logger.info("Nicio comandă de la telefon; sar peste redare.")

        except Exception as e:
            logger.error(f"Eroare bluetooth: {e}")
            self.indicator.no_connection()

    # ─── Record + VAD ─────────────────────────────────────────────────────────

    async def _record_and_send(self, send_fn):
        """
        Pornește recorder, trimite chunks prin send_fn,
        se oprește când VAD detectează silențiu.
        """
        self._recording_done.clear()
        self.recorder.on_silence = self._on_silence
        self.recorder.start()

        chunks_sent = 0

        # Citim chunks și le trimitem cât timp înregistrăm
        while not self._recording_done.is_set():
            chunk = self.recorder.get_chunk(timeout=0.1)
            if chunk:
                if asyncio.iscoroutinefunction(send_fn):
                    await send_fn(chunk)
                else:
                    send_fn(chunk)
                chunks_sent += 1

        self.recorder.stop()
        logger.info(f"Înregistrare terminată — {chunks_sent} chunks trimiși")

    def _on_silence(self):
        """Apelat de VAD din thread-ul microfon."""
        self._recording_done.set()

    # ─── Redare răspuns ───────────────────────────────────────────────────────

    async def _play_response(self, audio_bytes: bytes):
        await self._play_response_async(audio_bytes)

    async def _play_response_async(self, audio_bytes: bytes):
        if audio_bytes.startswith(b"RIFF"):
            out_file = RESPONSE_FILE_WAV
        else:
            out_file = RESPONSE_FILE_MP3

        with open(out_file, "wb") as f:
            f.write(audio_bytes)
        logger.info(f"Răspuns salvat: {out_file} ({len(audio_bytes)} bytes)")

        # Temporar oprim stream-ul de microfon pentru a evita input overflow
        detector_prev = True
        try:
            try:
                # dacă mic stream există, oprim
                self.mic.stop()
                logger.info("SharedMicStream oprit pentru redare")
            except Exception as e:
                logger.warning(f"Eroare stop microfon: {e}")

            # Dezactivăm detectorul ca să nu declanșeze pe playback-ul propriu
            detector_prev = getattr(self.detector, "running", True)
            try:
                self.detector.running = False
                logger.info("WakeWordDetector dezactivat pentru redare")
            except Exception as e:
                logger.warning(f"Eroare dezactivare detector: {e}")

            # Redăm fișierul și așteptăm să se termine
            logger.info(f"Lansez redare: {out_file}")
            self.player.play(out_file)
            
            # Așteptăm terminarea redării cu timeout
            timeout_secs = 30
            elapsed = 0
            while elapsed < timeout_secs:
                if getattr(self.player, "file_process", None) is None:
                    # Dacă s-a terminat, ieșim
                    break
                await asyncio.sleep(0.2)
                elapsed += 0.2
            
            if elapsed >= timeout_secs:
                logger.warning(f"Redare timeout după {timeout_secs}s")
            else:
                logger.info("Redare terminată")

        except Exception as e:
            logger.error(f"Eroare în _play_response_async: {e}", exc_info=True)
        finally:
            # Repornim microfonul și detectorul
            try:
                self.mic.start()
                logger.info("SharedMicStream repornit")
            except Exception as e:
                logger.warning(f"Eroare repornire microfon: {e}")
            try:
                self.detector.running = detector_prev
                logger.info(f"WakeWordDetector reactivat (running={detector_prev})")
            except Exception as e:
                logger.warning(f"Eroare reactivare detector: {e}")
            self.indicator.idle()
