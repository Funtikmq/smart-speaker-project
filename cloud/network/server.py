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
                    # Client may include a hint whether it wants the server
                    # to perform TTS (cloud TTS) or not. Default: True
                    play_tts_on_server = command.get("play_tts_on_server", True)

                    if not audio_buffer:
                        logger.info("Buffer gol.")
                        continue

                    await _process_audio(websocket, bytes(audio_buffer), play_tts_on_server)
                    audio_buffer.clear()

                # ─── Flux telefon: STT deja făcut, primim textul direct ────────
                elif cmd_type == "text_query":
                    text = command.get("text", "").strip()
                    if not text:
                        continue

                    # Allow client to request whether server should produce
                    # TTS audio or just send the textual response.
                    play_tts_on_server = command.get("play_tts_on_server", True)

                    logger.info(f"Text query de la telefon: {text}")
                    await _process_text(websocket, text, play_tts_on_server)

    except websockets.ConnectionClosed:
        logger.info(f"Client deconectat: {client}")


async def _process_audio(websocket, pcm_bytes: bytes, play_tts_on_server: bool = True):
    """Primește PCM raw → STT → AI → (opțional TTS) → trimite înapoi.

    The `play_tts_on_server` flag controls whether the server should
    synthesize/send audio back to the client. When False the server will
    only send textual responses (useful when the phone will play native TTS).
    """
    logger.info(f"Audio primit: {len(pcm_bytes)} bytes")

    text = stt.transcribe(pcm_bytes)
    logger.info(f"Transcriere: {text}")

    await websocket.send(json.dumps({
        "type": "transcription",
        "text": text,
    }))

    if not text:
        return

    await _process_text(websocket, text, play_tts_on_server)


async def _process_text(websocket, text: str, play_tts_on_server: bool = True):
    """Primește text → AI → (opțional TTS) → trimite răspuns înapoi."""

    # ─── AI ───────────────────────────────────────────────────────────────────
    # response_text = ai.respond(text)          # decomentează când va fi Claude configurat
    response_text = f"You said: {text}"          # placeholder simplu

    logger.info(f"Răspuns AI: {response_text}")

    await websocket.send(json.dumps({
        "type": "response",
        "text": response_text,
    }))

    # ─── TTS ──────────────────────────────────────────────────────────────────
    if play_tts_on_server:
        try:
            audio_bytes = tts.synthesize(response_text)
            await websocket.send(audio_bytes)
            logger.info(f"TTS trimis: {len(audio_bytes)} bytes")
        except Exception as e:
            logger.warning(f"Eroare la sintetizare TTS server: {e}")
    else:
        logger.info("Client requested no server TTS; skipping cloud TTS.")
