import asyncio
import logging
import config
from core.assistant import Assistant

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)


def main():
    assistant = Assistant()
    assistant.start()

    print("Sistem pornit. Apasă ENTER pentru a începe înregistrarea.")

    try:
        while True:
            input(">>> Apasă ENTER pentru a înregistra...\n")
            asyncio.run(assistant.handle_conversation())
            print("Gata! Poți înregistra din nou.\n")

    except KeyboardInterrupt:
        print("Oprit.")
    finally:
        assistant.stop()


if __name__ == "__main__":
    main()