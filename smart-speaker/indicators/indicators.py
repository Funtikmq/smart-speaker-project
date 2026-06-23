import logging

logger = logging.getLogger(__name__)

try:
    from gpiozero import LED
except ImportError:
    LED = None


class _LogOnlyLED:
    def __init__(self, pin: int, color: str):
        self.pin = pin
        self.color = color
        self.is_lit = False

    def on(self):
        self.is_lit = True
        logger.debug("LED %s GPIO%s: ON", self.color, self.pin)

    def off(self):
        self.is_lit = False
        logger.debug("LED %s GPIO%s: OFF", self.color, self.pin)

    def close(self):
        pass


class Indicator:
    """
    Indicatori vizuali pe Raspberry Pi:
      - rosu GPIO17: scriptul ruleaza
      - albastru GPIO27: conexiune Bluetooth RFCOMM activa
      - galben GPIO22: inregistrare activa
    """

    RED_PIN = 17
    BLUE_PIN = 27
    YELLOW_PIN = 22

    def __init__(self, sounds_dir: str | None = None, device: str = "default"):
        self.sounds_dir = sounds_dir
        self.device = device

        self.red = self._create_led(self.RED_PIN, "red")
        self.blue = self._create_led(self.BLUE_PIN, "blue")
        self.yellow = self._create_led(self.YELLOW_PIN, "yellow")

        self.script_running(True)
        self.bluetooth_connected(False)
        self.recording_started(False)

    def _create_led(self, pin: int, color: str):
        if LED is None:
            logger.warning(
                "gpiozero nu este disponibil; LED %s GPIO%s va fi doar logat.",
                color,
                pin,
            )
            return _LogOnlyLED(pin, color)

        try:
            return LED(pin)
        except Exception as exc:
            logger.warning(
                "Nu pot initializa LED %s pe GPIO%s: %s. Folosesc fallback log-only.",
                color,
                pin,
                exc,
            )
            return _LogOnlyLED(pin, color)

    def _set_led(self, led, color: str, state: bool):
        if state:
            led.on()
        else:
            led.off()
        logger.debug("Indicator %s: %s", color, "ON" if state else "OFF")

    def script_running(self, state: bool = True):
        self._set_led(self.red, "red", state)

    def bluetooth_connected(self, state: bool = True):
        logger.info("Indicator: bluetooth %s", "conectat" if state else "deconectat")
        self._set_led(self.blue, "blue", state)

    def recording_started(self, state: bool = True):
        logger.info("Indicator: inregistrare %s", "pornita" if state else "oprita")
        self._set_led(self.yellow, "yellow", state)

    def recording_stopped(self):
        self.recording_started(False)

    def no_connection(self):
        logger.warning("Indicator: nicio conexiune")
        self.recording_stopped()

    def cloud_connected(self):
        logger.info("Indicator: cloud conectat")

    def listening(self):
        logger.info("Indicator: astept comanda")

    def processing(self):
        logger.info("Indicator: proceseaza")
        self.recording_stopped()

    def idle(self):
        logger.info("Indicator: idle")
        self.recording_stopped()

    def all_off(self):
        for led in (self.yellow, self.blue, self.red):
            try:
                led.off()
            except Exception as exc:
                logger.debug("Eroare la stingerea LED-ului: %s", exc)

    def shutdown(self):
        logger.info("Indicator: shutdown")
        self.all_off()
        for led in (self.yellow, self.blue, self.red):
            try:
                led.close()
            except Exception as exc:
                logger.debug("Eroare la inchiderea LED-ului: %s", exc)
