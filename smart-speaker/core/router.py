import asyncio
import logging
import websockets
import config

logger = logging.getLogger(__name__)


class ConnectionState:
    BLUETOOTH_CLOUD  = "bluetooth_cloud"
    BLUETOOTH_SIMPLE = "bluetooth_simple"
    CLOUD_DIRECT     = "cloud_direct"
    OFFLINE          = "offline"


class Router:

    def __init__(self):
        self._state      = ConnectionState.OFFLINE
        self._bt_server  = None   # setat de Assistant după creare

    def set_bt_server(self, bt_server) -> None:
        """Injectăm referința la BluetoothServer pentru check_internet."""
        self._bt_server = bt_server

    # ─── Resolve ──────────────────────────────────────────────────────────────

    async def resolve(self) -> str:
        """
        Logica de rutare:

        BT conectat (telefon activ)?
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
        """
        Verifică dacă telefonul e conectat prin conexiunea RFCOMM existentă.
        Nu mai deschidem un socket nou — folosim starea BluetoothServer.
        """
        if self._bt_server is None:
            logger.debug("BT check: bt_server nesetat")
            return False
        connected = self._bt_server.is_connected
        logger.debug(f"BT check: is_connected={connected}")
        return connected

    async def _check_phone_internet(self) -> bool:
        """
        Trimite check_internet prin conexiunea RFCOMM existentă.
        Telefonul răspunde cu {'type': 'net_status', 'online': true/false}.
        """
        if self._bt_server is None or not self._bt_server.is_connected:
            logger.debug("check_internet: telefon deconectat")
            return False

        try:
            # Trimitem pe conexiunea existentă cu protocolul corect
            self._bt_server.send_command({"type": "check_internet"})

            # Așteptăm răspunsul din command_queue (maxim 4 secunde)
            response = await asyncio.wait_for(
                self._bt_server.recv_command(),
                timeout=4.0,
            )
            online = response.get("online", False)
            logger.info(f"Phone internet: online={online}")
            return online

        except asyncio.TimeoutError:
            logger.warning("check_internet: timeout — presupun offline")
            return False
        except Exception as e:
            logger.debug(f"check_internet failed: {e}")
            return False

    async def _check_cloud(self) -> bool:
        """Verifică dacă serverul cloud e accesibil direct de pe Pi."""
        try:
            async with websockets.connect(config.SERVER_URL, open_timeout=3):
                return True
        except Exception as e:
            logger.debug(f"Cloud check failed: {e}")
            return False

    @property
    def state(self) -> str:
        return self._state