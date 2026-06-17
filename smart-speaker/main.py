import asyncio
import logging
import signal
import config
from core.assistant import Assistant

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)


async def main():
    assistant = Assistant()
    await assistant.start()
    logger.info("Sistem pornit — ascult wake word...")

    loop = asyncio.get_running_loop()

    # Oprire curată la Ctrl+C sau kill
    stop_event = asyncio.Event()

    def _shutdown():
        logger.info("Semnal oprire primit.")
        try:
            assistant.indicator.all_off()
        except Exception as e:
            logger.warning("Nu am putut stinge LED-urile imediat: %s", e)
        loop.call_soon_threadsafe(stop_event.set)

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _shutdown)
        except NotImplementedError:
            signal.signal(sig, lambda *_: _shutdown())

    try:
        await stop_event.wait()
    finally:
        assistant.stop()
        logger.info("Sistem oprit.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Oprire fortata din tastatura.")
