import asyncio
import websockets
import json
import logging

import stt
import tts
import ai

logger = logging.getLogger(__name__)


async def handle_client(websocket):
    client = websocket.remote_address
    logger.info(f"Client conectat: {client}")

    audio_buffer = bytearray()

    try:
        async for message in websocket:

            # bytes → chunk audio de la Pi
            if isinstance(message, bytes):
                audio_buffer.extend(message)

            # string → comandă JSON
            elif isinstance(message, str):
                try:
                    command = json.loads(message)
                except json.JSONDecodeError:
                    continue

                if command.get("type") == "recording_stopped":
                    if not audio_buffer:
                        logger.info("Buffer gol.")
                        continue

                    logger.info(f"Audio primit: {len(audio_buffer)} bytes")

                    # ─── STT ──────────────────────────────────────────
                    text = stt.transcribe(bytes(audio_buffer))
                    audio_buffer.clear()
                    logger.info(f"Transcriere: {text}")

                    await websocket.send(json.dumps({
                        "type": "transcription",
                        "text": text
                    }))

                    if not text:
                        continue

                    # ─── Răspuns test (fără Claude momentan) ─────────────────────────────────────
                    response_text = f"Ai spus: {text}"

                    await websocket.send(json.dumps({
                        "type": "response",
                        "text": response_text
                    }))


                    # ─── TTS ──────────────────────────────────────────
                    audio_bytes = tts.synthesize(response_text)
                    await websocket.send(audio_bytes)
                    logger.info(f"TTS trimis: {len(audio_bytes)} bytes")

    except websockets.ConnectionClosed:
        logger.info(f"Client deconectat: {client}")