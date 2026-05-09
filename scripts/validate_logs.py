#!/usr/bin/env python3
"""
BOPE — validate_logs.py
MISIÓN 1-A: Verifica que las medallas registradas en ORDEN-DE-BATALLA.md
existan también en el legajo individual de cada soldado (logs/personnel/).

Falla con exit(1) y mensaje claro si hay discrepancias.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
ORDEN_PATH = ROOT / "logs" / "ORDEN-DE-BATALLA.md"
PERSONNEL_DIR = ROOT / "logs" / "personnel"
RECORDS_PATH = ROOT / "logs" / "RECORDS.md"

ERRORS = []


def parse_orden_batalla(path: Path) -> dict:
    """
    Lee ORDEN-DE-BATALLA.md y extrae por soldado:
    - nombre (key)
    - rango
    - lista de medallas
    Soporta líneas de tabla con formato:
    | FORGE · BACK | SOLDADO | 🏅 Cruz de Combate |
    """
    if not path.exists():
        print(f"⚠️  AVISO: {path} no encontrado — saltando validación de medallas")
        return {}

    soldiers = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]  # eliminar vacíos
            if len(parts) < 3:
                continue
            # Detectar si es fila de datos (no header/separator)
            if "---" in parts[0] or parts[0].lower() in ["soldado", "agente", "nombre"]:
                continue
            name = parts[0]
            rango = parts[1] if len(parts) > 1 else ""
            # Las medallas pueden estar en la 3ra o siguientes columnas
            medallas_raw = " ".join(parts[2:]) if len(parts) > 2 else ""
            # Extraer nombres de medallas (no emojis solos)
            medallas = [m.strip() for m in re.split(r"[,;|]", medallas_raw) if m.strip() and len(m.strip()) > 2]
            soldiers[name] = {"rango": rango, "medallas": medallas}
    return soldiers


def parse_legajo(path: Path) -> list:
    """
    Lee el legajo de un soldado y extrae la lista de medallas
    de la sección 'Historial de condecoraciones' o similar.
    """
    if not path.exists():
        return None  # None = legajo no encontrado

    medallas = []
    in_section = False
    with open(path, encoding="utf-8") as f:
        for line in f:
            line_stripped = line.strip()
            # Detectar inicio de sección de medallas
            if re.search(r"(condecorac|medalla|historial.*medal|honores)", line_stripped, re.I):
                in_section = True
                continue
            # Detectar fin de sección (nuevo header)
            if in_section and line_stripped.startswith("#"):
                in_section = False
            if in_section and line_stripped:
                # Extraer texto de la línea (puede ser bullet, tabla o texto)
                cleaned = re.sub(r"^[-*|•·]+", "", line_stripped).strip()
                if cleaned and len(cleaned) > 2:
                    medallas.append(cleaned)
    return medallas


def validate_medals():
    """
    Compara medallas en ORDEN-DE-BATALLA vs legajos individuales.
    Si ORDEN-DE-BATALLA no existe o no tiene medallas, pasa silenciosamente.
    """
    soldiers = parse_orden_batalla(ORDEN_PATH)
    if not soldiers:
        print("ℹ️  ORDEN-DE-BATALLA.md sin datos de medallas — validación omitida")
        return

    for nombre, data in soldiers.items():
        if not data["medallas"]:
            continue  # Soldado sin medallas — OK

        # Buscar legajo: nombre puede ser "FORGE · BACK" → buscar archivo que lo contenga
        slug = re.sub(r"[^a-zA-Z0-9]", "-", nombre.split("·")[0].strip().upper())
        legajo_candidates = list(PERSONNEL_DIR.glob(f"*{slug}*")) + list(PERSONNEL_DIR.glob(f"*{nombre.split()[0].upper()}*"))

        if not legajo_candidates:
            # Si no hay legajo, solo advertir si hay medallas
            ERRORS.append(
                f"❌ Legajo no encontrado para '{nombre}' "
                f"(tiene {len(data['medallas'])} medalla(s) en ORDEN-DE-BATALLA.md)"
            )
            continue

        legajo_path = legajo_candidates[0]
        medallas_legajo = parse_legajo(legajo_path)

        if medallas_legajo is None:
            ERRORS.append(f"❌ No se pudo leer el legajo de '{nombre}': {legajo_path}")
            continue

        # Validar que cada medalla del ORDEN esté en el legajo
        for medalla in data["medallas"]:
            medalla_clean = re.sub(r"[🏅🎖️🥇🥈🥉\s]", "", medalla).lower()
            found = any(medalla_clean in re.sub(r"[\s🏅🎖️]", "", m).lower() for m in medallas_legajo)
            if not found and len(medalla_clean) > 3:
                ERRORS.append(
                    f"⚠️  Medalla '{medalla}' de '{nombre}' está en ORDEN-DE-BATALLA "
                    f"pero NO en su legajo ({legajo_path.name})"
                )


def main():
    print("🔍 BOPE — Validando coherencia de registros...")
    print(f"   ORDEN-DE-BATALLA: {ORDEN_PATH}")
    print(f"   Personnel dir:    {PERSONNEL_DIR}")
    print()

    if not PERSONNEL_DIR.exists():
        print("ℹ️  Directorio logs/personnel/ no encontrado — validación omitida")
        sys.exit(0)

    validate_medals()

    if ERRORS:
        print("❌ VALIDACIÓN FALLIDA — Inconsistencias detectadas:")
        for err in ERRORS:
            print(f"   {err}")
        print()
        print("💡 Acción requerida: sincronizar ORDEN-DE-BATALLA.md con los legajos en logs/personnel/")
        sys.exit(1)
    else:
        print("✅ Validación de medallas: OK — todos los registros coherentes")
        sys.exit(0)


if __name__ == "__main__":
    main()
