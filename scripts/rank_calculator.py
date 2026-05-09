#!/usr/bin/env python3
"""
BOPE — rank_calculator.py
MISIÓN 2: Lee logs/RECORDS.md, calcula el score de cada soldado
según la fórmula de la Constitución BOPE, y genera
logs/ASCENSOS-PENDIENTES.md con los ascensos que corresponden.

Fórmula:
  Score = (Completion × 0.30) + (Calidad × 0.25) +
          (Latencia × 0.20) + (Colaboración × 0.15) +
          (Gap Detection × 0.10)

Umbrales de rango:
  CANDIDATO   < 40           sin mínimo de misiones
  RECLUTA     40–59          ≥ 3 misiones
  SOLDADO     60–74          ≥ 8 misiones
  ESPECIALISTA 75–89         ≥ 15 misiones
  ÉLITE       90+            ≥ 25 misiones
"""

import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent.parent
RECORDS_PATH = ROOT / "logs" / "RECORDS.md"
ORDEN_PATH   = ROOT / "logs" / "ORDEN-DE-BATALLA.md"
OUTPUT_PATH  = ROOT / "logs" / "ASCENSOS-PENDIENTES.md"

# Ponderaciones de la Constitución
WEIGHTS = {
    "completion":   0.30,
    "calidad":      0.25,
    "latencia":     0.20,
    "colaboracion": 0.15,
    "gap_detection":0.10,
}

# Umbrales: (score_min, misiones_min) -> rango
RANK_THRESHOLDS = [
    (90, 25, "ÉLITE"),
    (75, 15, "ESPECIALISTA"),
    (60,  8, "SOLDADO"),
    (40,  3, "RECLUTA"),
    (0,   0, "CANDIDATO"),
]


def determine_rank(score: float, missions: int) -> str:
    for score_min, missions_min, rango in RANK_THRESHOLDS:
        if score >= score_min and missions >= missions_min:
            return rango
    return "CANDIDATO"


def parse_records(path: Path) -> list:
    """
    Lee RECORDS.md y extrae por soldado:
    - nombre
    - misiones_completadas
    - scores por dimensión (si existen como columnas o en sección individual)
    - score_total (si ya está calculado) o None

    Formato de tabla esperado:
    | Soldado | Misiones | Completion | Calidad | Latencia | Colaboración | Gap | Score |
    """
    if not path.exists():
        print(f"⚠️  {path} no encontrado — no se puede calcular rangos")
        return []

    soldiers = []
    headers = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]

            # Línea de separador
            if all(re.match(r"^-+$", p) for p in parts):
                continue

            # Línea de headers
            if not headers:
                headers = [h.lower().replace(" ", "_") for h in parts]
                continue

            # Líneas de datos
            if len(parts) < len(headers):
                parts += [""] * (len(headers) - len(parts))

            row = dict(zip(headers, parts))

            def safe_float(key, default=0.0):
                for k in headers:
                    if key in k:
                        try:
                            return float(row.get(k, 0))
                        except (ValueError, TypeError):
                            return default
                return default

            def safe_int(key, default=0):
                for k in headers:
                    if key in k:
                        try:
                            return int(float(row.get(k, 0)))
                        except (ValueError, TypeError):
                            return default
                return default

            nombre = row.get(headers[0], "").strip()
            if not nombre or nombre.lower() in ["soldado", "agente", "nombre", ""]:
                continue

            misiones = safe_int("mision", 0)

            # Si hay score_total directo, usarlo
            score_total = safe_float("score", -1)

            if score_total < 0:
                # Calcular desde dimensiones
                completion    = safe_float("completion")
                calidad       = safe_float("calidad")
                latencia      = safe_float("latencia")
                colaboracion  = safe_float("colabor")
                gap_detection = safe_float("gap")

                score_total = (
                    completion    * WEIGHTS["completion"] +
                    calidad       * WEIGHTS["calidad"] +
                    latencia      * WEIGHTS["latencia"] +
                    colaboracion  * WEIGHTS["colaboracion"] +
                    gap_detection * WEIGHTS["gap_detection"]
                )

            soldiers.append({
                "nombre":   nombre,
                "misiones": misiones,
                "score":    round(score_total, 1),
            })

    return soldiers


def parse_rango_actual(path: Path) -> dict:
    """
    Lee ORDEN-DE-BATALLA.md y extrae el rango actual de cada soldado.
    """
    if not path.exists():
        return {}

    rangos = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            parts = [p for p in parts if p]
            if len(parts) < 2:
                continue
            if "---" in parts[0] or parts[0].lower() in ["soldado", "agente", "nombre"]:
                continue
            nombre = parts[0]
            rango  = parts[1] if len(parts) > 1 else "CANDIDATO"
            rangos[nombre] = rango.strip()
    return rangos


def rank_label(rango: str) -> int:
    order = {"CANDIDATO": 0, "RECLUTA": 1, "SOLDADO": 2, "ESPECIALISTA": 3, "ÉLITE": 4}
    return order.get(rango.upper(), -1)


def generate_report(soldiers: list, rangos_actuales: dict) -> str:
    hoy = date.today().strftime("%Y-%m-%d")
    # Próxima revisión = siguiente lunes
    from datetime import timedelta
    dias_hasta_lunes = (7 - date.today().weekday()) % 7 or 7
    proxima = (date.today() + timedelta(days=dias_hasta_lunes)).strftime("%Y-%m-%d")

    ascensos = []
    sin_cambio = []

    for s in soldiers:
        rango_nuevo = determine_rank(s["score"], s["misiones"])
        rango_actual = rangos_actuales.get(s["nombre"], "CANDIDATO")

        if rank_label(rango_nuevo) > rank_label(rango_actual):
            faltante = "—"
            ascensos.append({
                **s,
                "rango_actual": rango_actual,
                "rango_nuevo":  rango_nuevo,
                "faltante":     faltante,
            })
        else:
            # Calcular cuánto falta para el siguiente rango
            siguiente = None
            for score_min, missions_min, rango in RANK_THRESHOLDS:
                if rank_label(rango) > rank_label(rango_nuevo):
                    siguiente = (score_min, missions_min, rango)
                    break

            if siguiente:
                score_falta    = max(0, siguiente[0] - s["score"])
                misiones_falta = max(0, siguiente[1] - s["misiones"])
                partes = []
                if score_falta > 0:
                    partes.append(f"+{score_falta:.1f} pts")
                if misiones_falta > 0:
                    partes.append(f"+{misiones_falta} misiones")
                faltante = ", ".join(partes) if partes else "—"
            else:
                faltante = "— rango máximo"

            sin_cambio.append({
                **s,
                "rango_actual": rango_actual,
                "rango_nuevo":  rango_nuevo,
                "faltante":     faltante,
            })

    lines = [
        "# ASCENSOS PENDIENTES — Cálculo automático BOPE",
        f"**Fecha de cálculo:** {hoy}  ",
        f"**Próxima revisión automática:** {proxima}",
        "",
        "> Generado por `scripts/rank_calculator.py`  ",
        "> Para confirmar un ascenso: `BOPE APPROVE ASCENSO [nombre]`  ",
        "> Para rechazar: `BOPE REJECT ASCENSO [nombre]`",
        "",
    ]

    if ascensos:
        lines.append("## ⬆️ Ascensos detectados")
        lines.append("")
        lines.append("| Soldado | Rango actual | Rango propuesto | Score | Misiones | Aprobación |")
        lines.append("|---------|-------------|-----------------|-------|----------|-----------|")
        for a in ascensos:
            lines.append(
                f"| {a['nombre']} | {a['rango_actual']} | **{a['rango_nuevo']}** "
                f"| {a['score']} | {a['misiones']} | ☑️ SANTIAGO |"
            )
        lines.append("")
    else:
        lines.append("## ⬆️ Ascensos detectados")
        lines.append("")
        lines.append("_Ningún ascenso pendiente esta semana._")
        lines.append("")

    if sin_cambio:
        lines.append("## 🟡 Sin cambios")
        lines.append("")
        lines.append("| Soldado | Rango actual | Score | Misiones | Faltante para siguiente |")
        lines.append("|---------|-------------|-------|----------|------------------------|")
        for s in sin_cambio:
            lines.append(
                f"| {s['nombre']} | {s['rango_actual']} | {s['score']} "
                f"| {s['misiones']} | {s['faltante']} |"
            )
        lines.append("")

    lines.append("---")
    lines.append(f"_Calculado automáticamente el {hoy} — BOPE Rank Engine v1_")

    return "\n".join(lines)


def main():
    print("🎯 BOPE — Calculando rangos del batallón...")
    print(f"   RECORDS:          {RECORDS_PATH}")
    print(f"   ORDEN-DE-BATALLA: {ORDEN_PATH}")
    print(f"   Output:           {OUTPUT_PATH}")
    print()

    soldiers = parse_records(RECORDS_PATH)
    if not soldiers:
        print("⚠️  No se encontraron datos en RECORDS.md. Generando reporte vacío.")
        soldiers = []

    rangos_actuales = parse_rango_actual(ORDEN_PATH)

    report = generate_report(soldiers, rangos_actuales)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"✅ Reporte generado en: {OUTPUT_PATH}")

    # Resumen en consola
    ascenso_count = report.count("☑️ SANTIAGO")
    if ascenso_count > 0:
        print(f"🚨 {ascenso_count} ascenso(s) pendiente(s) de aprobación del Comandante")
    else:
        print("🟢 Ningún ascenso pendiente esta semana")

    sys.exit(0)


if __name__ == "__main__":
    main()
