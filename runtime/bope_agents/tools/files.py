from __future__ import annotations

from pathlib import Path


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def append_line(path: Path, line: str) -> None:
    with path.open("a", encoding="utf-8") as handle:
        if not line.endswith("\n"):
            line += "\n"
        handle.write(line)
