from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOGS_DIR = ROOT / "logs"
DOCS_DIR = ROOT / "docs"
MISSION_PATH = LOGS_DIR / "MISION-ACTIVA.md"
COMMS_PATH = LOGS_DIR / "COMMS.log"
SUMMARY_PATH = LOGS_DIR / "MEMORIA" / "ULTIMO-RESUMEN.md"
