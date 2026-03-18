import asyncio
import websockets
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketClient:
    """
    Gestionează conexiunea WebSocket între Pi și serverul cloud.

    Trimite:  chunks PCM audio (bytes) + comenzi JSON
    Primește: transcriere JSON + răspuns text JSON + audio TTS (bytes)
    """

    def __init__(self, url):
        self.url = url
        self._ws = None

    async def connect(self):
        self._ws = await websockets.connect(self.url)
        logger.info(f"Conectat la {self.url}")

    async def disconnect(self):
        if self._ws:
            await self._ws.close()
            self._ws = None

    async def send_audio(self, chunk: bytes):
        """Trimite un chunk PCM audio."""
        if self._ws:
            await self._ws.send(chunk)

    async def send_command(self, command: dict):
        """Trimite o comandă JSON."""
        if self._ws:
            await self._ws.send(json.dumps(command))

    async def recv_json(self, timeout=30) -> dict:
        """Primește și parsează un mesaj JSON."""
        message = await asyncio.wait_for(self._ws.recv(), timeout=timeout)
        return json.loads(message)

    async def recv_bytes(self, timeout=30) -> bytes:
        """Primește un mesaj bytes (audio TTS)."""
        return await asyncio.wait_for(self._ws.recv(), timeout=timeout)