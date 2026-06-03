import os
import sys
import json
import shutil
import tempfile
from http.server import BaseHTTPRequestHandler
from pathlib import Path

# ── paths ──────────────────────────────────────────────────────────────────
_HERE = Path(__file__).parent
_REPO = _HERE.parent
_RUNTIME = _REPO / "runtime"
_MISSION_SRC = _REPO / "logs" / "MISION-ACTIVA.md"

# Set BOPE_LOGS_DIR before importing bope_agents (cold start only)
_TMP = Path(tempfile.mkdtemp(prefix="bope_"))
os.environ.setdefault("BOPE_LOGS_DIR", str(_TMP))
(_TMP / "MEMORIA").mkdir(parents=True, exist_ok=True)
if _MISSION_SRC.exists():
    shutil.copy(_MISSION_SRC, _TMP / "MISION-ACTIVA.md")

sys.path.insert(0, str(_RUNTIME))

from bope_agents.main import run  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Ensure mission file is in tmp (warm-start safety)
        tmp = Path(os.environ["BOPE_LOGS_DIR"])
        (tmp / "MEMORIA").mkdir(parents=True, exist_ok=True)
        if _MISSION_SRC.exists() and not (tmp / "MISION-ACTIVA.md").exists():
            shutil.copy(_MISSION_SRC, tmp / "MISION-ACTIVA.md")

        try:
            result = run()
            body = json.dumps({"ok": True, "result": result}, ensure_ascii=False)
            status = 200
        except Exception as exc:
            body = json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False)
            status = 500

        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        pass  # suppress default access logs
