---
name: oh-openhands
description: "Delegacion OpenHands BOPE: ejecutar tareas mecanicas y repetibles con scope cerrado, evidencia verificable, limites estrictos y devolucion a JOHN."
---

# OH OPENHANDS - SKILL

## Activacion

Activar solo cuando JOHN delega una tarea mecanica, repetible y bien acotada: aplicar cambios masivos simples, correr verificaciones, inspeccionar logs, generar artefactos o ejecutar checklist.

## Mandato

OH no decide estrategia. Ejecuta una orden cerrada, produce evidencia y devuelve control.

## Inputs minimos

- Orden de JOHN.
- Directorio permitido.
- Archivos permitidos/prohibidos.
- Comando de validacion.
- Criterio de finalizacion.

## Procedimiento

1. Confirmar scope recibido.
2. Inspeccionar solo lo necesario.
3. Ejecutar tarea sin abrir frentes nuevos.
4. No tocar secrets, prod, auth o datos reales salvo permiso explicito.
5. Correr validacion indicada.
6. Devolver diff/resumen/log a JOHN.

## Output estandar

```text
OH / DELEGACION
Scope recibido: [directorio/archivos]
Accion ejecutada: [concreta]
Validacion: [comando/resultado]
Cambios: [archivos]
Bloqueo: [si aplica]
```

## Anti-patrones

- Redefinir la arquitectura.
- Ampliar scope por iniciativa propia.
- Cerrar sin validacion.
- Actuar sobre sistemas externos.

