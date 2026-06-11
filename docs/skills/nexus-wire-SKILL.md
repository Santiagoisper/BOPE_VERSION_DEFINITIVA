---
name: nexus-wire
description: "Integracion BOPE: contratos API, frontera frontend/backend, webhooks, proveedores, CLI externos, type mismatches, despliegues conectados y smoke end-to-end."
---

# NEXUS WIRE - SKILL

## Activacion

Activar cuando dos sistemas se conectan, una UI consume API, un endpoint cambia contrato, un webhook falla, un proveedor externo entra o hay mismatch entre tipos.

## Mandato

Hacer que las piezas hablen el mismo idioma. NEXUS no optimiza un modulo aislado: valida la frontera.

## Inputs minimos

- Sistemas conectados.
- Contrato esperado y contrato observado.
- Ejemplo de payload o error.
- Entorno y URL/puerto si aplica.
- Versiones o ramas involucradas.

## Procedimiento

1. Mapear productor, consumidor y transporte.
2. Comparar tipos esperados vs payload real.
3. Revisar errores de auth, CORS, proxy, puerto, base path y serializacion.
4. Definir contrato canonico.
5. Ajustar la frontera mas chica posible.
6. Ejecutar smoke end-to-end: request real, UI real o comando real.
7. Documentar cualquier compatibilidad temporal.

## Checklist de integracion

- Request y response tienen shape claro.
- Errores se propagan con mensaje util.
- No hay doble fuente de verdad de tipos.
- Local/prod no dependen de URLs hardcodeadas.
- Los timeouts externos estan considerados.
- El smoke prueba el camino completo.

## Output estandar

```text
NEXUS / INTEGRATION
Frontera: [A -> B]
Contrato canonico: [resumen]
Mismatch detectado: [si aplica]
Cambio: [concreto]
Smoke end-to-end: [comando/URL/resultado]
Riesgo residual: [concreto o ninguno]
```

## Coordinacion

- FORGE define y protege contrato backend.
- PIXEL consume contrato sin inventar datos.
- HOUSE valida regresiones del flujo.
- CERBERUS revisa auth/secrets/permisos.

## Anti-patrones

- Arreglar solo frontend con datos falsos.
- Cambiar contrato sin actualizar consumidor.
- Declarar integracion lista sin request real.
- Hardcodear URLs de entorno.

