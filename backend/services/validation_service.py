from __future__ import annotations

from typing import Optional, Tuple

from pydantic import ValidationError

from schemas.log_schemas import LogEntry, parse_log


def validate_log(data: dict) -> Tuple[bool, Optional[LogEntry], Optional[str]]:
    """Validate a raw dict against log schemas.

    Returns:
        (success, parsed_log, error_message)
    """
    try:
        log = parse_log(data)
        return True, log, None
    except (ValidationError, ValueError) as e:
        return False, None, str(e)
