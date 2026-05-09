# AGENTS.md

Este repositorio usa Codex con bootstrap real en `.Codex/AGENTS.md`.

## Punto de entrada correcto

- Codex carga `.Codex/AGENTS.md` automaticamente al abrir esta carpeta.
- Los agentes operativos viven en `.Codex/agents/`.
- El estado y los logs del sistema viven en `logs/`.

## Activacion

1. Abrir Codex en la raiz del repo.
2. Verificar que exista `.Codex/AGENTS.md`.
3. Escribir `CODEX` en el chat para mostrar el selector de agentes BOPE.
4. Elegir un agente.

Regla simple:
- Si elegis `JOHN RAMBO`, puede coordinar o delegar.
- Si elegis cualquier otro agente, trabaja solo ese agente.
- No se guarda mision ni logs por defecto.

## Archivos clave

- `.Codex/AGENTS.md`
- `.Codex/BOPE-CONSTITUCION.md`
- `.Codex/ORDEN-DE-BATALLA.md`
- `.Codex/agents/JOHN.md`
- `logs/MISION-ACTIVA.md`
- `logs/NOTICIAS-BATALLON.log`

## Nota

El archivo `AGENTS.md` de la raiz no es el bootstrap canonico. Su funcion es evitar confusion y apuntar al setup real que Codex usa en este proyecto.
