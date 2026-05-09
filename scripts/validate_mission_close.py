#!/usr/bin/env python3
"""
BOPE — validate_mission_close.py
MISIÓN 1-B: Verifica que toda misión marcada como CERRADA en
logs/MISION-ACTIVA.md tenga su fila correspondiente en logs/missions/INDEX.md.

Falla con exit(1) si una misión está cerrada pero no indexada.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
MISION_ACTIVA_PATH = ROOT / "logs" / "MISION-ACTIVA.md"
MISSIONS_INDEX_PATH = ROOT / "logs" / "missions" / "INDEX.md"

ERRORS = []


def parse_mision_activa(path: Path) -> dict:
    """
    Lee MISION-ACTIVA.md y extrae:
    - estado (ACTIVA | CERRADA | STANDBY)
    - nombre de la misión
    """
    if not path.exists():
        return {"estado": None, "nombre": None}

    data = {"estado": None, "nombre": None}
    with open(path, encoding="utf-8") as f:
        content = f.read()

    # Buscar estado
    estado_match = re.search(r"estado[:\s]+([A-ZÁÉÍÓÚ]+)", content, re.I)
    if estado_match:
        data["estado"] = estado_match.group(1).upper().strip()

    # Buscar nombre de misión
    nombre_match = re.search(r"(?:misión|mision|nombre)[:\s]+([^\n]+)", content, re.I)
    if nombre_match:
        data["nombre"] = nombre_match.group(1).strip().strip("*_`")

    # Alternativa: primera línea H1 como nombre
    if not data["nombre"]:
        h1_match = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_match:
            data["nombre"] = h1_match.group(1).strip()

    return data


def parse_missions_index(path: Path) -> list:
    """
    Lee missions/INDEX.md y extrae lista de nombres de misiones registradas.
    Formato esperado en filas de tabla:
    | 2026-05-07 | innova-scoring-fix | CERRADA | ... |
    """
    if not path.exists():
        return []  # No hay índice aún — OK si la misión también está abierta

    missions = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]
            if len(parts) < 2:
                continue
            if "---" in parts[0] or parts[0].lower() in ["fecha", "date", "misión", "mision"]:
                continue
            # El nombre de la misión puede estar en col 1 o 2
            for col in parts:
                if col and len(col) > 3 and not re.match(r"^\d{4}-", col):
                    missions.append(col.lower().strip())
    return missions


def validate_mission_close():
    mision = parse_mision_activa(MISION_ACTIVA_PATH)

    if not mision["estado"]:
        print("ℹ️  MISION-ACTIVA.md sin estado definido — validación omitida")
        return

    print(f"   Estado actual:  {mision['estado']}")
    print(f"   Misión:         {mision['nombre'] or 'no detectada'}")
    print()

    # Si la misión está ACTIVA o en STANDBY, no hay nada que validar
    if mision["estado"] not in ["CERRADA", "ARCHIVADA", "COMPLETADA"]:
        print(f"✅ Misión en estado {mision['estado']} — no requiere indexación todavía")
        return

    # Si está CERRADA, debe estar en el INDEX
    missions_indexed = parse_missions_index(MISSIONS_INDEX_PATH)

    if not missions_indexed:
        # No existe INDEX — crear advertencia pero no fallar (puede ser primer cierre)
        print("⚠️  logs/missions/INDEX.md no encontrado o vacío")
        print("   Si es la primera misión cerrada, crear el INDEX con la fila correspondiente")
        ERRORS.append(
            f"Misión '{mision['nombre']}' marcada como {mision['estado']} "
            f"pero logs/missions/INDEX.md no existe o está vacío"
        )
        return

    # Buscar el nombre de la misión en el índice
    nombre_lower = (mision["nombre"] or "").lower()
    found = any(nombre_lower in idx or idx in nombre_lower for idx in missions_indexed)

    if not found:
        ERRORS.append(
            f"❌ Misión '{mision['nombre']}' está {mision['estado']} en MISION-ACTIVA.md "
            f"pero NO aparece en logs/missions/INDEX.md"
        )


def main():
    print("🔍 BOPE — Validando cierre de misiones...")
    print(f"   MISION-ACTIVA:    {MISION_ACTIVA_PATH}")
    print(f"   MISSIONS INDEX:   {MISSIONS_INDEX_PATH}")
    print()

    validate_mission_close()

    if ERRORS:
        print("❌ VALIDACIÓN FALLIDA — Misión cerrada no indexada:")
        for err in ERRORS:
            print(f"   {err}")
        print()
        print("💡 Acción requerida: agregar la fila de cierre en logs/missions/INDEX.md")
        sys.exit(1)
    else:
        print("✅ Validación de cierre de misiones: OK")
        sys.exit(0)


if __name__ == "__main__":
    main()
