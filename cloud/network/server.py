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

            # bytes → chunk audio PCM de la Pi
            if isinstance(message, bytes):
                audio_buffer.extend(message)

            # string → comandă JSON
            elif isinstance(message, str):
                try:
                    command = json.loads(message)
                except json.JSONDecodeError:
                    continue

                cmd_type = command.get("type")

                # ─── Flux normal: Pi trimite audio + recording_stopped ─────────
                if cmd_type == "recording_stopped":
                    if not audio_buffer:
                        logger.info("Buffer gol.")
                        continue

                    await _process_audio(websocket, bytes(audio_buffer))
                    audio_buffer.clear()

                # ─── Flux telefon: STT deja făcut, primim textul direct ────────
                elif cmd_type == "text_query":
                    text = command.get("text", "").strip()
                    if not text:
                        continue

                    logger.info(f"Text query de la telefon: {text}")
                    await _process_text(websocket, text)

    except websockets.ConnectionClosed:
        logger.info(f"Client deconectat: {client}")


async def _process_audio(websocket, pcm_bytes: bytes):
    """Primește PCM raw → STT → AI → TTS → trimite înapoi."""
    logger.info(f"Audio primit: {len(pcm_bytes)} bytes")

    text = stt.transcribe(pcm_bytes)
    logger.info(f"Transcriere: {text}")

    await websocket.send(json.dumps({
        "type": "transcription",
        "text": text,
    }))

    if not text:
        return

    await _process_text(websocket, text)


async def _process_text(websocket, text: str):
    """Primește text → AI → TTS → trimite răspuns înapoi."""

    # ─── AI ───────────────────────────────────────────────────────────────────
    # response_text = ai.respond(text)          # decomentează când va fi Claude configurat
    response_text = f"You said: {text}"          # placeholder simplu

    logger.info(f"Răspuns AI: {response_text}")

    await websocket.send(json.dumps({
        "type": "response",
        "text": response_text,
    }))

    # ─── TTS ──────────────────────────────────────────────────────────────────
    audio_bytes = tts.synthesize(response_text)
    await websocket.send(audio_bytes)
    logger.info(f"TTS trimis: {len(audio_bytes)} bytes")