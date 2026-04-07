# ARCHITECTURE

BOPE funciona como sistema de mando documental con base operativa y futura plataforma de ejecucion.

Capas:
- Rules Layer: `docs/BOPE-RULES.md`
- Mission State Layer: `docs/MISION-ACTIVA.md`
- Communication Layer: `docs/COMMS.log`
- Role Prompt Layer: `prompts/*.md`
- Platform Layer: `app/`, `orchestrator/`, `db/`

Principio central:
Todo agente debe bootstrappear desde `docs/AGENT-BOOTSTRAP.md` antes de actuar.
