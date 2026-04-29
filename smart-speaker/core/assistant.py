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
            self._play_response(audio_bytes)

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

            audio_bytes = await self.bt_server.recv_audio(timeout=30)
            self._play_response(audio_bytes)

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

    def _play_response(self, audio_bytes: bytes):
        with open(RESPONSE_FILE, "wb") as f:
            f.write(audio_bytes)
        self.player.play(RESPONSE_FILE)
        self.indicator.idle()