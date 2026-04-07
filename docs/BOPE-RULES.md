# BOPE-RULES

## I. Cadena de mando

1. El COMMANDER define prioridad y decision final.
2. Cambios estructurales al sistema requieren orden del COMMANDER.
3. Mantener disciplina de roles. Un agente, una responsabilidad.

## II. Estado canonico

4. `docs/MISION-ACTIVA.md` es la unica fuente de verdad del estado operativo.
5. Ningun agente puede leer estado desde la interfaz, memoria de sesion u otro agente. Solo desde archivos y evidencia verificable.
6. No inventar estado ni evidencia. Si no esta escrito, no existe.
7. La interfaz BOPE renderiza el estado canonico. No lo reemplaza ni lo genera.

## III. Escritura y registro

8. Todo agente registra avances, decisiones y eventos en `docs/COMMS.log`.
9. Formato obligatorio en `docs/COMMS.log`: `[AGENTE] ACCION: descripcion`
10. Toda ejecucion debe producir evidencia verificable.
11. Solo se escribe en `docs/MISION-ACTIVA.md` cuando hay cambio real de estado.

## IV. Handoff entre agentes

12. Antes de pasar control, el agente saliente escribe en `docs/COMMS.log`: estado actual, proximo paso y agente receptor.
13. El agente entrante lee `docs/AGENT-BOOTSTRAP.md`, `docs/MISION-ACTIVA.md` y las ultimas 10 lineas de `docs/COMMS.log` antes de actuar.
14. Sin lectura de bootstrap, la accion es invalida.

## V. Bloqueos

15. Si hay bloqueo, reportarlo en `docs/COMMS.log` con evidencia, causa raiz y plan de desbloqueo.
16. No workarounds silenciosos. Todo bloqueo es visible.

## VI. Propiedad de escritura

| Archivo | Quien puede escribir |
|---|---|
| `docs/MISION-ACTIVA.md` | Solo el COMMANDER |
| `docs/COMMS.log` | Agentes |
| `docs/BOPE-RULES.md` | Solo el COMMANDER |
| `prompts/*.md` | Solo el COMMANDER |
| Interfaz BOPE | Solo renderiza. Nunca modifica estado. |

17. Ningun agente modifica `docs/MISION-ACTIVA.md` sin orden explicita del COMMANDER.
18. Ningun agente modifica `docs/BOPE-RULES.md` ni archivos de `prompts/` sin orden explicita del COMMANDER.
19. La interfaz BOPE no tiene permisos de escritura sobre ningun archivo de estado.
