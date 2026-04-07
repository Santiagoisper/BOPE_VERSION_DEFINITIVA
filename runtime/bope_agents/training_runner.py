from __future__ import annotations

import json
from pathlib import Path


def render_bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def run_theater(theater_root: Path) -> dict[str, str]:
    scenario = json.loads((theater_root / "scenario.json").read_text(encoding="utf-8"))
    outputs_dir = theater_root / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)

    signals = scenario["signals"]
    soldier_positions = scenario["soldier_positions"]
    close_criteria = scenario["close_criteria"]

    john_order = "\n".join(
        [
            f"# Orden de JOHN - {scenario['mission_id']}",
            "",
            "## Decision de mando",
            "- Ownership inicial fijado a `NEXUS WIRE`.",
            "- Frente principal: `integracion y triage operativo`.",
            "- Resto del batallon en espera hasta verdad operativa minima.",
            "",
            "## Razon",
            "- Las senales se contradicen entre gateway, frontend y cola de eventos.",
            "- La base se mantiene sana, asi que abrir backend puro seria prematuro.",
            "- No hay evidencia suficiente para escalar a seguridad como frente principal.",
            "",
            "## Restricciones activas",
            render_bullets(scenario["restrictions"]),
            "",
            "## Criterio de cierre inmediato",
            render_bullets(close_criteria),
        ]
    )

    nexus_report = "\n".join(
        [
            f"# Reporte NEXUS - {scenario['mission_id']}",
            "",
            "## Lectura de senales",
            render_bullets(
                [
                    f"{signal['source']}: {signal['status']} | {signal['detail']}"
                    for signal in signals
                ]
            ),
            "",
            "## Posicion de soldados en espera",
            render_bullets(soldier_positions),
            "",
            "## Diagnostico tactico",
            "- El corte mas probable esta en la capa de gateway/autenticacion con impacto sobre el flujo de login.",
            "- La cola detenida sugiere degradacion intercapas, no caida total del sistema.",
            "- La base estable baja prioridad de una intervencion inmediata de FORGE como ownership principal.",
            "",
            "## Recomendacion a JOHN",
            "- Mantener ownership en NEXUS hasta confirmar punto de corte.",
            "- Preparar handoff secundario a FORGE solo si el gateway deriva en endpoint roto.",
            "- Mantener a PIXEL en espera observando superficie, sin abrir frente nuevo.",
        ]
    )

    after_action = "\n".join(
        [
            f"# After Action - {scenario['mission_id']}",
            "",
            "## Veredicto",
            "- `VICTORIA`",
            "",
            "## Que salio bien",
            "- JOHN fijo ownership antes de abrir caos lateral.",
            "- El frente inicial fue de integracion, no de intuicion.",
            "- Se preservo la economia operativa del batallon.",
            "",
            "## Que salio mal",
            "- El teatro mostro baja observabilidad inicial.",
            "- FORGE, PIXEL y CERBERUS tenian senales reales pero sin punto de reunion temprano.",
            "",
            "## Aprendizaje",
            f"- {scenario['expected_learning']}",
            "",
            "## Siguiente mejora",
            "- Agregar en futuros teatros una sala tactica minima con verdad operativa compartida.",
        ]
    )

    files = {
        "john-order.md": john_order,
        "nexus-report.md": nexus_report,
        "after-action.md": after_action,
    }

    for name, content in files.items():
        (outputs_dir / name).write_text(content + "\n", encoding="utf-8")

    return {name: str(outputs_dir / name) for name in files}


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    theater = root / "docs" / "training" / "theaters" / "BOPE-TRAIN-RAMBO-001"
    produced = run_theater(theater)
    for key, value in produced.items():
        print(f"{key}: {value}")
