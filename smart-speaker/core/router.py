import socket
import asyncio
import logging
import websockets
import config

logger = logging.getLogger(__name__)


class ConnectionState:
    BLUETOOTH_CLOUD = "bluetooth_cloud"    
    BLUETOOTH_SIMPLE = "bluetooth_simple"  
    CLOUD_DIRECT = "cloud_direct"          
    OFFLINE = "offline"                    


class Router:

    def __init__(self):
        self._state = ConnectionState.OFFLINE

    async def resolve(self) -> str:
        """
        Determină cea mai bună conexiune disponibilă.

        BT conectat?
            DA → Telefonul are net? → BLUETOOTH_CLOUD : BLUETOOTH_SIMPLE
            NU → Placa are net?    → CLOUD_DIRECT    : OFFLINE
        """
        if not config.USE_BLUETOOTH:
            logger.info("Bluetooth dezactivat din config — verific net direct")
            if await self._check_cloud():
                self._state = ConnectionState.CLOUD_DIRECT
                logger.info("Stare: CLOUD_DIRECT")
            else:
                self._state = ConnectionState.OFFLINE
                logger.info("Stare: OFFLINE")
            return self._state

        if self._check_bluetooth():
            logger.info("Bluetooth disponibil — verific net pe telefon")
            phone_has_net = await self._check_phone_internet()
            if phone_has_net:
                self._state = ConnectionState.BLUETOOTH_CLOUD
                logger.info("Stare: BLUETOOTH_CLOUD")
            else:
                self._state = ConnectionState.BLUETOOTH_SIMPLE
                logger.info("Stare: BLUETOOTH_SIMPLE")
        else:
            logger.info("Bluetooth indisponibil — verific net direct")
            if await self._check_cloud():
                self._state = ConnectionState.CLOUD_DIRECT
                logger.info("Stare: CLOUD_DIRECT")
            else:
                self._state = ConnectionState.OFFLINE
                logger.info("Stare: OFFLINE")

        return self._state

    # ─── Verificări ───────────────────────────────────────────────────────────

    def _check_bluetooth(self) -> bool:
        """Verifică dacă telefonul e paired și accesibil prin RFCOMM."""
        try:
            sock = socket.socket(
                socket.AF_BLUETOOTH,
                socket.SOCK_STREAM,
                socket.BTPROTO_RFCOMM
            )
            sock.settimeout(2)
            result = sock.connect_ex((config.PHONE_BT_ADDRESS, config.BT_CHANNEL))
            sock.close()
            return result == 0
        except Exception as e:
            logger.debug(f"BT check failed: {e}")
            return False

    async def _check_phone_internet(self) -> bool:
        """
        Întreabă telefonul prin RFCOMM dacă are conexiune internet.
        Telefonul răspunde cu {'type': 'net_status', 'online': true/false}
        """
        try:
            sock = socket.socket(
                socket.AF_BLUETOOTH,
                socket.SOCK_STREAM,
                socket.BTPROTO_RFCOMM
            )
            sock.settimeout(3)
            sock.connect((config.PHONE_BT_ADDRESS, config.BT_CHANNEL))

            import json
            msg = json.dumps({"type": "check_internet"}).encode()
            sock.send(len(msg).to_bytes(2, 'big') + msg)

            header = sock.recv(2)
            length = int.from_bytes(header, 'big')
            data = json.loads(sock.recv(length).decode())
            sock.close()

            return data.get("online", False)
        except Exception as e:
            logger.debug(f"Phone internet check failed: {e}")
            return False

    async def _check_cloud(self) -> bool:
        """Verifică dacă serverul cloud e accesibil direct."""
        try:
            async with websockets.connect(
                config.SERVER_URL,
                open_timeout=3
            ):
                return True
        except Exception as e:
            logger.debug(f"Cloud check failed: {e}")
            return False

    @property
    def state(self) -> str:
        return self._state