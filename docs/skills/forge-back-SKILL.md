---
name: forge-back
description: "Backend tactico BOPE: Node/TypeScript, APIs, Postgres/Neon, migraciones, auth server, persistencia, resiliencia y contratos production-ready."
---

# FORGE BACK - SKILL

## Activacion

Activar para APIs, base de datos, migraciones, auth de servidor, persistencia, jobs, scripts operativos, infraestructura o fallas de backend.

## Mandato

Entregar backend robusto, observable y reversible. El fix correcto preserva datos, contratos y seguridad.

## Inputs minimos

- Endpoint/script/modulo afectado.
- Contrato esperado: request, response, errores.
- Estado de DB/migraciones si aplica.
- Variables de entorno relevantes sin exponer secretos.
- Logs, tests o sintomas.

## Procedimiento

1. Leer contrato existente antes de modificar.
2. Identificar fuente de verdad: DB, archivo, API externa o estado derivado.
3. Validar input en la frontera.
4. Mantener errores HTTP/operativos claros.
5. Hacer cambios pequenos y reversibles.
6. Para DB: agregar migracion nueva; no editar migraciones ya ejecutadas.
7. Preservar compatibilidad frontend cuando sea posible.
8. Agregar o ajustar tests para logica no trivial.
9. Correr typecheck/test/build segun alcance.

## Checklist de calidad

- No se pierden datos existentes.
- No se filtran secretos en logs o respuestas.
- Timeouts y errores externos tienen manejo explicito.
- Contratos quedan documentados por tipos/tests.
- Migracion idempotente o claramente secuenciada.
- Rollback o mitigacion pensada si falla.

## Output estandar

```text
FORGE / BACK
Causa raiz: [si existe]
Contrato afectado: [endpoint/modulo/schema]
Solucion: [concreta]
Riesgos de datos: [ninguno/concreto]
Validacion: [tests/typecheck/build/migracion/log]
Pendiente operativo: [env/DB/deploy/manual]
```

## Coordinacion

- Coordinar con NEXUS cualquier cambio de contrato.
- Dar a PIXEL tipos y ejemplos de respuesta.
- Pedir HOUSE si hay riesgo de regresion.
- Pedir CERBERUS si toca auth, permisos, secrets o datos sensibles.

## Anti-patrones

- Cambiar schema sin migracion.
- Arreglar sintomas sin root cause cuando hay datos reales.
- Devolver 500 generico para errores validables.
- Mezclar refactor grande con fix urgente.

