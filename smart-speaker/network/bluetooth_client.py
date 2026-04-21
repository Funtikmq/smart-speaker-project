import socket
import threading
import asyncio
import struct
import json
import logging

import config

logger = logging.getLogger(__name__)

# Tipuri mesaje
MSG_AUDIO = 0x01
MSG_COMMAND = 0x02
MSG_STATUS = 0x03


class BluetoothServer:
    """
    Server RFCOMM — gestionează conexiunea cu telefonul Android.
    Protocol: 1 byte tip + 2 bytes lungime + N bytes date
    """

    def __init__(self):
        self._server_sock = None
        self._client_sock = None
        self._thread = None
        self._running = False
        self._audio_queue = None
        self._command_queue = None
        self._loop = None
        self._connected = threading.Event()

    # ─── Start / Stop ─────────────────────────────────────────────────────────

    def start(self):
        if self._running:
            return
        self._running = True
        self._loop = asyncio.get_event_loop()
        self._audio_queue = asyncio.Queue()
        self._command_queue = asyncio.Queue()
        self._thread = threading.Thread(
            target=self._accept_loop, daemon=True
        )
        self._thread.start()
        logger.info(f"Bluetooth server pornit pe canal {config.BT_CHANNEL}")

    def stop(self):
        self._running = False
        self._connected.clear()
        if self._client_sock:
            try:
                self._client_sock.shutdown(socket.SHUT_RDWR)
                self._client_sock.close()
            except:
                pass
            self._client_sock = None
        if self._server_sock:
            try:
                self._server_sock.shutdown(socket.SHUT_RDWR)
                self._server_sock.close()
            except:
                pass
            self._server_sock = None
        logger.info("Bluetooth server oprit.")

    # ─── Accept loop ──────────────────────────────────────────────────────────

    def _accept_loop(self):
        self._server_sock = socket.socket(
            socket.AF_BLUETOOTH,
            socket.SOCK_STREAM,
            socket.BTPROTO_RFCOMM
        )
        self._server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
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
        while self._running and self._client_sock:
            try:
                # Citește header: 1 byte tip + 2 bytes lungime
                header = self._recv_exact(3)
                if not header:
                    break

                msg_type = header[0]
                length = struct.unpack('>H', header[1:3])[0]

                # Citește datele
                data = self._recv_exact(length)
                if not data:
                    break

                # Pune în queue-ul corespunzător
                if msg_type == MSG_AUDIO:
                    asyncio.run_coroutine_threadsafe(
                        self._audio_queue.put(data),
                        self._loop
                    )
                elif msg_type in (MSG_COMMAND, MSG_STATUS):
                    try:
                        parsed = json.loads(data.decode())
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

    def _recv_exact(self, n: int) -> bytes:
        """Citește exact N bytes."""
        data = b''
        while len(data) < n:
            chunk = self._client_sock.recv(n - len(data))
            if not chunk:
                return None
            data += chunk
        return data

    # ─── Send ─────────────────────────────────────────────────────────────────

    def send_audio(self, pcm_chunk: bytes):
        """Trimite chunk PCM spre telefon."""
        self._send(MSG_AUDIO, pcm_chunk)

    def send_command(self, command: dict):
        """Trimite comandă JSON spre telefon."""
        self._send(MSG_COMMAND, json.dumps(command).encode())

    def _send_status(self, status: dict):
        """Trimite status JSON spre telefon."""
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

    async def recv_audio(self, timeout=30) -> bytes:
        """Primește audio de la telefon (TTS procesat)."""
        return await asyncio.wait_for(
            self._audio_queue.get(),
            timeout=timeout
        )

    async def recv_command(self, timeout=10) -> dict:
        """Primește comandă de la telefon."""
        return await asyncio.wait_for(
            self._command_queue.get(),
            timeout=timeout
        )

    # ─── Status ───────────────────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self._connected.is_set()

    def wait_for_connection(self, timeout=None) -> bool:
        """Blochează până se conectează telefonul."""
        return self._connected.wait(timeout=timeout)