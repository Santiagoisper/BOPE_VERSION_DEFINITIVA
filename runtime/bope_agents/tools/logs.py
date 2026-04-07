from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from bope_agents.config import COMMS_PATH, SUMMARY_PATH
from bope_agents.tools.files import append_line


TZ = ZoneInfo("America/Buenos_Aires")


def now_stamp() -> str:
    return datetime.now(TZ).isoformat(timespec="seconds")


def write_comms(actor: str, kind: str, payload: str) -> None:
    append_line(COMMS_PATH, f"[{actor}] {kind}: {payload}")


def write_summary(text: str) -> None:
    append_line(SUMMARY_PATH, f"\n## Runtime update {now_stamp()}\n{text}\n")
