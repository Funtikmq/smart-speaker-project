import socket
import threading
import asyncio
import struct
import json
import logging

import config

logger = logging.getLogger(__name__)

MSG_AUDIO   = 0x01
MSG_COMMAND = 0x02
MSG_STATUS  = 0x03


class BluetoothServer:
    """
    Server RFCOMM — gestionează conexiunea cu telefonul Android.
    Protocol: 1 byte tip + 2 bytes lungime big-endian + N bytes date
    """

    def __init__(self):
        self._server_sock    = None
        self._client_sock    = None
        self._thread         = None
        self._running        = False
        self._audio_queue    = None
        self._command_queue  = None
        self._loop           = None
        self._connected      = threading.Event()

    # ─── Start / Stop ─────────────────────────────────────────────────────────

    def start(self):
        if self._running:
            return
        self._running = True
        self._loop = asyncio.get_event_loop()
        self._audio_queue   = asyncio.Queue()
        self._command_queue = asyncio.Queue()
        self._thread = threading.Thread(target=self._accept_loop, daemon=True)
        self._thread.start()
        logger.info(f"Bluetooth server pornit pe canal {config.BT_CHANNEL}")

    def stop(self):
        self._running = False
        self._connected.clear()
        if self._client_sock:
            try:
                self._client_sock.shutdown(socket.SHUT_RDWR)
                self._client_sock.close()
            except Exception:
                pass
            self._client_sock = None
        if self._server_sock:
            try:
                self._server_sock.shutdown(socket.SHUT_RDWR)
                self._server_sock.close()
            except Exception:
                pass
            self._server_sock = None
        logger.info("Bluetooth server oprit.")

    # ─── Accept loop ──────────────────────────────────────────────────────────

    def _accept_loop(self):
        self._server_sock = socket.socket(
            socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM
        )
        self._server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR,  1)
        self._server_sock.bind((config.PI_BT_ADDRESS, config.BT_CHANNEL))
        self._server_sock.listen(1)

        while self._running:
            try:
                logger.info("Aștept conexiune Bluetooth...")
                self._client_sock, addr = self._server_sock.accept()
                logger.info(f"Telefon conectat: {addr}")
                self._connected.set()
                self._send_status({"type": "connected"})
                self._recv_loop()
            except Exception as e:
                if self._running:
                    logger.error(f"BT accept error: {e}")
            finally:
                self._connected.clear()
                self._client_sock = None
                logger.info("Telefon deconectat.")

    # ─── Recv loop ────────────────────────────────────────────────────────────

    def _recv_loop(self):
        tts_buffer = bytearray()   # acumulăm chunks TTS până la tts_done

        while self._running and self._client_sock:
            try:
                header = self._recv_exact(3)
                if not header:
                    break

                msg_type = header[0]
                length   = struct.unpack('>H', header[1:3])[0]
                data     = self._recv_exact(length)
                if not data:
                    break

                if msg_type == MSG_AUDIO:
                    # Chunk audio TTS de la telefon — acumulăm
                    tts_buffer.extend(data)

                elif msg_type in (MSG_COMMAND, MSG_STATUS):
                    try:
                        parsed = json.loads(data.decode())

                        if parsed.get("type") == "tts_done":
                            # Telefonul a terminat de trimis TTS — punem tot în queue
                            if tts_buffer:
                                audio_copy = bytes(tts_buffer)
                                tts_buffer.clear()
                                asyncio.run_coroutine_threadsafe(
                                    self._audio_queue.put(audio_copy),
                                    self._loop
                                )
                                logger.info(f"TTS complet primit de la telefon: {len(audio_copy)} bytes")
                        else:
                            asyncio.run_coroutine_threadsafe(
                                self._command_queue.put(parsed),
                                self._loop
                            )
                    except json.JSONDecodeError:
                        logger.warning("JSON invalid primit")

            except Exception as e:
                if self._running:
                    logger.error(f"BT recv error: {e}")
                break

    def _recv_exact(self, n: int) -> bytes | None:
        data = b''
        while len(data) < n:
            try:
                chunk = self._client_sock.recv(n - len(data))
            except Exception:
                return None
            if not chunk:
                return None
            data += chunk
        return data

    # ─── Send ─────────────────────────────────────────────────────────────────

    def send_audio(self, pcm_chunk: bytes):
        self._send(MSG_AUDIO, pcm_chunk)

    def send_command(self, command: dict):
        self._send(MSG_COMMAND, json.dumps(command).encode())

    def _send_status(self, status: dict):
        self._send(MSG_STATUS, json.dumps(status).encode())

    def _send(self, msg_type: int, data: bytes):
        if not self._client_sock:
            logger.warning("Niciun client conectat.")
            return
        try:
            header = struct.pack('>BH', msg_type, len(data))
            self._client_sock.send(header + data)
        except Exception as e:
            logger.error(f"BT send error: {e}")

    # ─── Receive async ────────────────────────────────────────────────────────

    async def recv_audio(self, timeout: float = 30) -> bytes:
        """Primește audio TTS complet de la telefon (după tts_done)."""
        return await asyncio.wait_for(self._audio_queue.get(), timeout=timeout)

    async def recv_command(self, timeout: float = 10) -> dict:
        """Primește o comandă JSON de la telefon."""
        return await asyncio.wait_for(self._command_queue.get(), timeout=timeout)

    # ─── Status ───────────────────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self._connected.is_set()

    def wait_for_connection(self, timeout=None) -> bool:
        return self._connected.wait(timeout=timeout)