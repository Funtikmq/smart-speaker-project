import os
import subprocess
import logging

logger = logging.getLogger(__name__)


class Indicator:
    """
    Stub pentru indicatori vizuali și sonori.
    Momentan doar sunet — LED-urile se adaugă mai târziu.
    """

    def __init__(self, sounds_dir: str, device: str = "default"):
        self.sounds_dir = sounds_dir
        self.device = device

    # ─── Sunet ────────────────────────────────────────────────────────────────

    def _play_sound(self, filename: str):
        path = os.path.join(self.sounds_dir, filename)
        if not os.path.exists(path):
            logger.warning(f"Sunet inexistent: {path}")
            return
        if filename.endswith(".mp3"):
            subprocess.Popen(["mpg123", path])
        else:
            subprocess.Popen(["aplay", f"-D{self.device}", path])

    # ─── LED (stub) ───────────────────────────────────────────────────────────

    def _set_led(self, color: str, state: bool):
        """Stub — va fi implementat când ledurile sunt conectate."""
        logger.debug(f"LED {color}: {'ON' if state else 'OFF'}")

    # ─── Public API ───────────────────────────────────────────────────────────

    def no_connection(self):
        """Nicio conexiune disponibilă."""
        logger.warning("Indicator: nicio conexiune")
        self._play_sound("no_connection.mp3")
        self._set_led("red", True)

    def bluetooth_connected(self):
        logger.info("Indicator: bluetooth conectat")
        self._set_led("blue", True)

    def cloud_connected(self):
        logger.info("Indicator: cloud conectat")
        self._set_led("green", True)

    def listening(self):
        logger.info("Indicator: ascultă")
        self._set_led("white", True)

    def processing(self):
        logger.info("Indicator: procesează")
        self._set_led("yellow", True)

    def idle(self):
        logger.info("Indicator: idle")
        self._set_led("red", False)
        self._set_led("blue", False)
        self._set_led("green", False)