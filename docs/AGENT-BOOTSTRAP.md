# AGENT-BOOTSTRAP - BOPE

Protocolo obligatorio de arranque. Sin esta secuencia, toda accion es invalida.

## Secuencia de arranque

1. Leer `docs/BOPE-RULES.md` completo.
2. Leer `docs/MISION-ACTIVA.md` para obtener el estado canonico actual.
3. Leer las ultimas 10 lineas de `docs/COMMS.log` para contexto reciente.
4. Identificar tu rol y responsabilidad.
5. Actuar solo dentro de tu alcance. No inventar estado ni evidencia.

## Antes de ejecutar cualquier accion

- Confirmar estado canonico desde `docs/MISION-ACTIVA.md`.
- Si tu accion modifica estado, registrarlo segun las reglas vigentes.
- Si haces handoff, registrar en `docs/COMMS.log`: estado, proximo paso y agente receptor.

## Ante un bloqueo

- Registrar en `docs/COMMS.log`: `[AGENTE] BLOQUEO: evidencia | causa raiz | plan`
- No continuar sin autorizacion del COMMANDER si el bloqueo es estructural.

## Propiedad de escritura

| Archivo | Quien puede escribir |
|---|---|
| `docs/MISION-ACTIVA.md` | Solo el COMMANDER |
| `docs/COMMS.log` | Agentes |
| `docs/BOPE-RULES.md` | Solo el COMMANDER |
| `prompts/*.md` | Solo el COMMANDER |
| Interfaz BOPE | Solo renderiza. Nunca modifica estado. |

## Regla de oro

> El estado no existe si no esta escrito en `docs/MISION-ACTIVA.md`.
> La interfaz BOPE renderiza. No define. No reemplaza.
> Solo el COMMANDER escribe el estado canonico.
