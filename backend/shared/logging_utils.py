import json
import logging
from datetime import datetime, timezone


logger = logging.getLogger()
logger.setLevel(logging.INFO)


def log_event(event_name: str, **kwargs):
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_name,
        **kwargs,
    }

    logger.info(json.dumps(payload, default=str))


def log_error(event_name: str, **kwargs):
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_name,
        **kwargs,
    }

    logger.exception(json.dumps(payload, default=str))


    