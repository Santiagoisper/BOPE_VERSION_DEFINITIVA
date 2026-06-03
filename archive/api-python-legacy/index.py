"""War Room — interfaz HTML de la sala de guerra BOPE."""
import re
from http.server import BaseHTTPRequestHandler
from pathlib import Path

_REPO = Path(__file__).parent.parent

MEDAL_MAP = {
    "NC": "🥇 Navy Cross",
    "BS": "🥈 Bronze Star",
    "CM": "⭐ Commendation Medal",
    "CA": "🎯 Combat Action Ribbon",
    "MS": "🔧 Meritorious Service",
    "GC": "🛡️ Good Conduct Medal",
    "PH": "💜 Purple Heart",
}

ROSTER = [
    ("🟡", "SANTIAGO ISBERT PERLENDER", "Comandante Supremo", "★★★★★"),
    ("🔴", "JOHN · RAMBO",              "Sargento Mayor",     "NC"),
    ("🔵", "PIXEL · FRONT",             "Teniente Frontend",  ""),
    ("🟤", "FORGE · BACK",              "Teniente Backend",   "BS"),
    ("🟢", "HOUSE · DOCTOR",            "Especialista QA",    "GC"),
    ("🟠", "MARCO AURELIO · HERALD",    "Capellán",           ""),
    ("🟣", "WINSTON · SCRIBE",          "Cronista",           "CM"),
    ("🩶", "CERBERUS · GUARDIAN",       "Guardián",           "CA"),
    ("🩵", "NEXUS · WIRE",              "Integrador",         "MS"),
    ("⚫", "BLADE · KILLER",            "Reserva Especial",   ""),
    ("🔥", "SICARIO · LOCO",            "Operativo Especial", "PH"),
]


def _parse_mission():
    path = _REPO / "logs" / "MISION-ACTIVA.md"
    if not path.exists():
        return {"estado": "—", "objetivo": "—", "proximo": "—"}
    txt = path.read_text(encoding="utf-8")

    def _field(label):
        m = re.search(rf"## {label}:\s*\n(.+?)(?=\n##|\Z)", txt, re.S)
        return m.group(1).strip() if m else "—"

    estado_m = re.search(r"## Estado:\s*(.+)", txt)
    return {
        "estado":   estado_m.group(1).strip() if estado_m else "—",
        "objetivo": _field("Objetivo"),
        "proximo":  _field("Próximo paso"),
    }


def _roster_rows():
    rows = []
    for emoji, nombre, cargo, medallas in ROSTER:
        if medallas == "★★★★★":
            medal_html = '<span class="stars">★★★★★</span>'
        elif medallas:
            medals_list = ", ".join(
                f'<span class="medal" title="{MEDAL_MAP.get(m, m)}">[{m}]</span>'
                for m in medallas.split()
            )
            medal_html = medals_list
        else:
            medal_html = '<span class="no-medal">—</span>'

        rows.append(
            f'<tr>'
            f'<td class="emoji">{emoji}</td>'
            f'<td class="nombre">{nombre}</td>'
            f'<td class="cargo">{cargo}</td>'
            f'<td class="medallas">{medal_html}</td>'
            f'</tr>'
        )
    return "\n".join(rows)


HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BOPE — SALA DE GUERRA</title>
<style>
  :root {{
    --bg:       #0a0b0d;
    --panel:    #0f1114;
    --border:   #1e2228;
    --green:    #00e676;
    --red:      #ff1744;
    --yellow:   #ffd600;
    --blue:     #40c4ff;
    --grey:     #546e7a;
    --text:     #cfd8dc;
    --dim:      #37474f;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg);
    color: var(--text);
    font-family: 'Courier New', monospace;
    min-height: 100vh;
    padding: 24px 16px;
  }}

  /* ── header ── */
  .header {{
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 20px 28px;
    margin-bottom: 20px;
    position: relative;
  }}
  .header::before {{
    content: '════════════════════════════════════════════════════════════════';
    display: block; color: var(--dim); font-size: 10px;
    overflow: hidden; white-space: nowrap; margin-bottom: 12px;
  }}
  .header::after {{
    content: '════════════════════════════════════════════════════════════════';
    display: block; color: var(--dim); font-size: 10px;
    overflow: hidden; white-space: nowrap; margin-top: 12px;
  }}
  .header-title {{
    font-size: 22px; font-weight: bold; letter-spacing: 3px;
    color: var(--yellow);
  }}
  .header-sub {{
    margin-top: 6px; font-size: 12px; color: var(--grey);
    letter-spacing: 1px;
  }}
  .badge-standby  {{ color: var(--yellow); }}
  .badge-activa   {{ color: var(--green);  }}
  .badge-cerrada  {{ color: var(--grey);   }}

  /* ── grid ── */
  .grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }}
  @media (max-width: 860px) {{ .grid {{ grid-template-columns: 1fr; }} }}

  /* ── panel ── */
  .panel {{
    background: var(--panel);
    border: 1px solid var(--border);
    padding: 20px 24px;
  }}
  .panel-title {{
    font-size: 11px; letter-spacing: 3px; color: var(--grey);
    text-transform: uppercase; margin-bottom: 14px;
    border-bottom: 1px solid var(--border); padding-bottom: 8px;
  }}

  /* ── mission ── */
  .mission-row {{ margin-bottom: 10px; font-size: 13px; }}
  .mission-label {{ color: var(--grey); font-size: 11px; letter-spacing: 1px; }}
  .mission-value {{ color: var(--text); margin-top: 3px; }}

  /* ── roster ── */
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  td {{ padding: 7px 6px; border-bottom: 1px solid var(--border); vertical-align: middle; }}
  tr:last-child td {{ border-bottom: none; }}
  td.emoji  {{ width: 30px; font-size: 16px; }}
  td.nombre {{ color: var(--text); font-weight: bold; min-width: 180px; }}
  td.cargo  {{ color: var(--grey); font-size: 11px; }}
  td.medallas {{ text-align: right; }}
  .stars    {{ color: var(--yellow); letter-spacing: 2px; }}
  .medal    {{ color: var(--green); cursor: help; }}
  .no-medal {{ color: var(--dim); }}

  /* ── terminal ── */
  .terminal-panel {{
    background: var(--panel);
    border: 1px solid var(--border);
    padding: 20px 24px;
    margin-bottom: 16px;
  }}
  .terminal {{
    background: #060708;
    border: 1px solid var(--border);
    padding: 16px;
    min-height: 160px;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
    color: var(--green);
    overflow-y: auto;
    max-height: 340px;
  }}
  .terminal .dim  {{ color: var(--dim); }}
  .terminal .err  {{ color: var(--red); }}

  /* ── button ── */
  .btn-row {{ margin-top: 14px; display: flex; gap: 10px; align-items: center; }}
  .btn {{
    background: transparent;
    border: 1px solid var(--green);
    color: var(--green);
    font-family: 'Courier New', monospace;
    font-size: 13px;
    letter-spacing: 2px;
    padding: 10px 24px;
    cursor: pointer;
    text-transform: uppercase;
    transition: background .15s, color .15s;
  }}
  .btn:hover {{ background: var(--green); color: var(--bg); }}
  .btn:disabled {{ border-color: var(--dim); color: var(--dim); cursor: not-allowed; }}
  .btn-red {{
    border-color: var(--red); color: var(--red);
  }}
  .btn-red:hover {{ background: var(--red); color: var(--bg); }}
  .spinner {{ display: none; color: var(--grey); font-size: 12px; }}
  .spinner.active {{ display: inline; }}

  /* ── footer ── */
  .footer {{
    text-align: center; font-size: 10px; color: var(--dim);
    letter-spacing: 2px; padding-top: 12px;
  }}
</style>
</head>
<body>

<div class="header">
  <div class="header-title">🪖 &nbsp;BOPE — SALA DE GUERRA</div>
  <div class="header-sub">
    Capa: CLAUDE &nbsp;|&nbsp; Fecha: {fecha} &nbsp;|&nbsp;
    Estado: <span class="badge-{estado_class}">{estado}</span>
  </div>
</div>

<div class="grid">

  <!-- MISIÓN ACTIVA -->
  <div class="panel">
    <div class="panel-title">📋 &nbsp;Misión activa</div>
    <div class="mission-row">
      <div class="mission-label">ESTADO</div>
      <div class="mission-value badge-{estado_class}">{estado}</div>
    </div>
    <div class="mission-row">
      <div class="mission-label">OBJETIVO</div>
      <div class="mission-value">{objetivo}</div>
    </div>
    <div class="mission-row">
      <div class="mission-label">PRÓXIMO PASO</div>
      <div class="mission-value">{proximo}</div>
    </div>
  </div>

  <!-- EFECTIVOS -->
  <div class="panel">
    <div class="panel-title">👥 &nbsp;Efectivos</div>
    <table>
      {roster_rows}
    </table>
  </div>

</div>

<!-- TERMINAL -->
<div class="terminal-panel">
  <div class="panel-title">⚡ &nbsp;Centro de comando — JOHN RAMBO</div>
  <div class="terminal" id="terminal"><span class="dim">// Sala de guerra en espera de órdenes, Comandante.</span></div>
  <div class="btn-row">
    <button class="btn" id="btn-run" onclick="ejecutarJohn()">▶ Ejecutar JOHN</button>
    <button class="btn btn-red" onclick="clearTerminal()">✕ Limpiar</button>
    <span class="spinner" id="spinner">⟳ procesando...</span>
  </div>
</div>

<div class="footer">BATALLÓN LISTO · EN ESPERA DE ÓRDENES · COMANDANTE SANTIAGO ISBERT PERLENDER</div>

<script>
  const terminal = document.getElementById('terminal');
  const btn      = document.getElementById('btn-run');
  const spinner  = document.getElementById('spinner');

  function log(text, cls) {{
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text;
    terminal.appendChild(span);
    terminal.scrollTop = terminal.scrollHeight;
  }}

  function clearTerminal() {{
    terminal.innerHTML = '<span class="dim">// Terminal limpia.</span>';
  }}

  async function ejecutarJohn() {{
    btn.disabled = true;
    spinner.classList.add('active');
    terminal.innerHTML = '';
    log('> EJECUTANDO ORDEN — JOHN RAMBO EN MANDO OPERATIVO\\n', 'dim');
    log('────────────────────────────────────────────────\\n', 'dim');

    try {{
      const res  = await fetch('/api/run');
      const data = await res.json();

      if (data.ok) {{
        const lines = data.result.split('\\n');
        for (const line of lines) {{
          if (line.trim()) log(line + '\\n');
        }}
        log('────────────────────────────────────────────────\\n', 'dim');
        log('✓ Orden ejecutada.\\n');
      }} else {{
        log('ERROR: ' + data.error + '\\n', 'err');
      }}
    }} catch (e) {{
      log('ERROR de red: ' + e.message + '\\n', 'err');
    }} finally {{
      btn.disabled = false;
      spinner.classList.remove('active');
    }}
  }}
</script>
</body>
</html>
"""


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        mission = _parse_mission()
        estado = mission["estado"]
        estado_class = (
            "activa"  if "ACTIVA" in estado.upper() else
            "cerrada" if "CERRADA" in estado.upper() else
            "standby"
        )

        from datetime import date
        html = HTML_TEMPLATE.format(
            fecha=date.today().strftime("%Y-%m-%d"),
            estado=estado,
            estado_class=estado_class,
            objetivo=mission["objetivo"].replace("\n", "<br>"),
            proximo=mission["proximo"].replace("\n", "<br>"),
            roster_rows=_roster_rows(),
        )

        encoded = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format, *args):
        pass
