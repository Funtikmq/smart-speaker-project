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
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown)

    try:
        await stop_event.wait()
    finally:
        assistant.stop()
        logger.info("Sistem oprit.")


if __name__ == "__main__":
    asyncio.run(main())