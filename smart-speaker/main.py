import asyncio
import logging
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

    try:
        # Loop-ul asyncio rulează permanent.
        # handle_conversation() este programat din thread-ul wake word
        # prin asyncio.run_coroutine_threadsafe() — deci nu blocăm aici.
        while True:
            await asyncio.sleep(1)

    except asyncio.CancelledError:
        pass
    finally:
        assistant.stop()
        logger.info("Sistem oprit.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOprit de utilizator.")