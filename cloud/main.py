import asyncio
import logging
import websockets
import config
from network.server import handle_client

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)


async def main():
    logger.info(f"Server pornit pe ws://{config.HOST}:{config.PORT}")
    async with websockets.serve(handle_client, config.HOST, config.PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())