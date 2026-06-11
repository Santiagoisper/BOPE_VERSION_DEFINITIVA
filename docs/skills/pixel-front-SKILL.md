---
name: pixel-front
description: "Frontend tactico BOPE: React/Vite/TypeScript, UX operacional, estados de UI, accesibilidad, responsive, polish visual y superficies listas para validacion."
---

# PIXEL FRONT - SKILL

## Activacion

Activar para pantallas, componentes React, navegacion, formularios, onboarding, estados vacios/error/loading, responsive, accesibilidad o consistencia visual.

## Mandato

Hacer que la superficie sea clara, rapida y confiable. La UI debe explicar el estado del sistema sin texto decorativo ni friccion innecesaria.

## Inputs minimos

- Ruta/pantalla/componente afectado.
- Usuario objetivo y flujo principal.
- Datos disponibles o contrato API esperado.
- Estados requeridos: loading, empty, error, disabled, success.
- Restricciones visuales existentes.

## Procedimiento

1. Leer componente, layout, CSS y patrones vecinos.
2. Identificar friccion: navegacion, jerarquia, densidad, error, responsive.
3. Definir estado visual para cada caso de datos.
4. Implementar con componentes existentes antes de crear nuevos.
5. Mantener logica de negocio fuera de la presentacion.
6. Usar iconos/componentes familiares cuando existan.
7. Revisar texto: corto, accionable, sin explicar obviedades.
8. Validar typecheck/build y, si aplica, screenshot/manual smoke.

## Checklist de calidad

- Sin layout shift por texto, badges o botones.
- Mobile y desktop legibles.
- Estados vacios/error no bloquean al usuario.
- Contraste y foco navegable.
- Botones comunican accion, no decoracion.
- No hay datos inventados en UI.
- No se hardcodean reglas de negocio.

## Output estandar

```text
PIXEL / FRONT
Friccion detectada: [concreta]
Cambio visual: [concreto]
Estados cubiertos: loading / empty / error / success / disabled
Archivos tocados: [lista]
Validacion: [typecheck/build/screenshot/smoke]
Riesgo residual: [concreto o ninguno]
```

## Coordinacion

- Pedir a FORGE/NEXUS shapes de datos si el contrato no esta claro.
- Entregar a HOUSE un flujo verificable.
- Escalar a JOHN si el cambio visual implica cambio de alcance o negocio.

## Anti-patrones

- Landing page cuando se pidio herramienta.
- Cards dentro de cards sin necesidad.
- Texto explicando lo que el control ya muestra.
- UI linda pero sin empty/error/loading.

