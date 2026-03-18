import asyncio
import threading
import logging

from audio.audio_recorder import AudioRecorder, close
from audio.audio_player import AudioPlayer
from network.client import WebSocketClient
import config

logger = logging.getLogger(__name__)

RESPONSE_FILE = "/tmp/response.mp3"


class Assistant:
    """
    Logica principală a boxei smart.
    Leagă AudioRecorder, AudioPlayer și WebSocketClient.
    """

    def __init__(self):
        self.recorder = AudioRecorder()
        self.player = AudioPlayer()
        self._stop_recording = threading.Event()

    def start(self):
        self.player.start()
        self.player.set_volume(90)
        logger.info("Assistant pornit.")

    def stop(self):
        self.recorder.stop()
        self.player.stop()
        close()
        logger.info("Assistant oprit.")

    def _wait_for_enter(self):
        input("Apasă ENTER pentru a opri înregistrarea...\n")
        self._stop_recording.set()

    async def handle_conversation(self):
        client = WebSocketClient(config.SERVER_URL)
        await client.connect()

        try:
            # ─── Înregistrare ─────────────────────────────────────────
            self._stop_recording.clear()
            self.recorder.start()
            logger.info("Înregistrare pornită.")

            threading.Thread(target=self._wait_for_enter, daemon=True).start()

            chunks_sent = 0
            while not self._stop_recording.is_set():
                chunk = self.recorder.get_chunk(timeout=0.1)
                if chunk:
                    await client.send_audio(chunk)
                    chunks_sent += 1

            self.recorder.stop()
            logger.info(f"Înregistrare oprită. Trimise {chunks_sent} chunks.")

            # ─── Semnal stop ──────────────────────────────────────────
            await client.send_command({"type": "recording_stopped"})
            logger.info("Se procesează...")

            # ─── Transcriere ──────────────────────────────────────────────────────────────
            data = await client.recv_json(timeout=30)
            if data.get("type") == "transcription":
                logger.info(f"Transcriere: {data['text']}")

            # ─── Răspuns text ─────────────────────────────────────────────────────────────
            data = await client.recv_json(timeout=30)
            if data.get("type") == "response":
                logger.info(f"Răspuns: {data['text']}")

            # ─── Audio TTS ────────────────────────────────────────────────────────────────
            audio_bytes = await client.recv_bytes(timeout=30)

            with open(RESPONSE_FILE, "wb") as f:     
                f.write(audio_bytes)

            self.player.play(RESPONSE_FILE)

            import time
            time.sleep(0.5)
            while self.player.file_process is not None:
                time.sleep(0.1)

        finally:
            await client.disconnect()