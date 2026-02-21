from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Tuple, Optional

import anthropic

from schemas.log_schemas import LogEntry, parse_log
from services.validation_service import validate_log

logger = logging.getLogger("nutriclaude.claude")

# Load system prompt from markdown file
SYSTEM_PROMPT_PATH = Path(__file__).resolve().parent.parent / "system-prompt.md"

def _load_system_prompt() -> str:
    with open(SYSTEM_PROMPT_PATH, "r") as f:
        return f.read()

SYSTEM_PROMPT = _load_system_prompt()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _extract_json(text: str) -> str:
    """Extract JSON from Claude's response, handling markdown fences and extra text."""
    # Try to find JSON in code fences first
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    # Try to find a JSON array first
    bracket_match = re.search(r"\[.*\]", text, re.DOTALL)
    if bracket_match:
        return bracket_match.group(0).strip()

    # Try to find a JSON object
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        return brace_match.group(0).strip()

    return text.strip()


async def extract_log(message: str) -> Tuple[bool, Optional[List[LogEntry]], Optional[List[dict]], Optional[str]]:
    """Send a user message to Claude and extract structured log data.

    Returns:
        (success, list_of_parsed_logs, list_of_raw_dicts, error_message)
    """
    eastern = timezone(timedelta(hours=-5))
    current_time = datetime.now(eastern).isoformat()

    user_message = f"Current date/time (US Eastern): {current_time}\n\nUser message: {message}"

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIError as e:
        logger.error(f"Claude API error: {e}")
        return False, None, None, f"Claude API error: {e}"

    raw_text = response.content[0].text
    logger.info(f"Claude raw response: {raw_text}")

    json_text = _extract_json(raw_text)

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed. Extracted text: {json_text}")
        return False, None, None, f"Claude returned invalid JSON: {e}"

    # Normalize to list
    if isinstance(data, dict):
        data = [data]

    # Validate each entry
    logs = []
    raw_dicts = []
    errors = []
    for entry in data:
        success, log, error = validate_log(entry)
        if success:
            logs.append(log)
            raw_dicts.append(entry)
        else:
            errors.append(f"{entry.get('type', '?')}: {error}")

    if not logs:
        return False, None, None, f"All entries failed validation: {'; '.join(errors)}"

    if errors:
        logger.warning(f"Some entries failed validation: {'; '.join(errors)}")

    return True, logs, raw_dicts, None
