from __future__ import annotations

import re

from bope_agents.models import MissionContext


def _extract_value(label: str, text: str) -> str:
    pattern = rf"- {re.escape(label)}:\s*(.+)"
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""


def _extract_section(title: str, text: str) -> list[str]:
    pattern = rf"## {re.escape(title)}\n(.*?)(?:\n## |\Z)"
    match = re.search(pattern, text, re.S)
    if not match:
        return []
    lines = []
    for raw in match.group(1).splitlines():
        stripped = raw.strip()
        if stripped.startswith("- "):
            lines.append(stripped[2:].strip())
    return lines


def parse_mission(text: str) -> MissionContext:
    objective = "\n".join(_extract_section("Objetivo", text))
    front = "\n".join(_extract_section("Frente principal esperado", text)).rstrip(". ").strip()
    next_step = "\n".join(_extract_section("Proximo paso", text))
    return MissionContext(
        mission_id=_extract_value("ID mision", text),
        objective=objective,
        front=front or "mixto",
        restrictions=_extract_section("Restricciones", text),
        close_criteria=_extract_section("Criterio de cierre", text),
        next_step=next_step,
    )
