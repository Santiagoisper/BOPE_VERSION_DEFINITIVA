# Skill: Risk Assessment

**Usar cuando:** una decision puede afectar produccion, datos, seguridad, costos, usuarios, integraciones o reputacion del batallon.

## Regla

Nombrar el riesgo antes de actuar. Un riesgo no nombrado suele convertirse en incidente.

## Procedimiento

1. Identificar activo afectado:
   - datos,
   - auth/secrets,
   - UX publica,
   - dinero/costo,
   - disponibilidad,
   - reputacion/memoria.
2. Clasificar probabilidad e impacto: bajo, medio, alto, critico.
3. Definir mitigacion o rollback.
4. Decidir si requiere especialista:
   - CERBERUS para seguridad.
   - FORGE para datos/backend.
   - NEXUS para integracion.
   - HOUSE para regresion.
   - MARCO para doctrina/sancion/premio.
5. Registrar riesgo residual al cierre.

## Output minimo

```text
Riesgo: [bajo|medio|alto|critico]
Activo: [que puede romperse]
Impacto: [concreto]
Mitigacion: [accion]
Especialista requerido: [si/no, quien]
Riesgo residual: [concreto o ninguno]
```

## Anti-patrones

- "Es simple" sin mirar datos reales.
- Tratar prod igual que local.
- Cambiar auth sin CERBERUS.
- Migrar DB sin plan de recuperacion.

