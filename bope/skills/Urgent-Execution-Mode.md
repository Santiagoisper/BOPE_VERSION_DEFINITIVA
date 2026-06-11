# Skill: Urgent Execution Mode

**Usar cuando:** hay N1/N2, bloqueo fuerte, ventana corta, sistema degradado o una orden directa exige ejecucion inmediata.

## Regla

Velocidad sin evidencia es ruido. En urgencia se reduce ceremonia, no se elimina control.

## Procedimiento

1. Confirmar severidad y objetivo inmediato.
2. Congelar scope: contencion, diagnostico o fix.
3. Tomar baseline rapido: git status, log, healthcheck, repro.
4. Ejecutar el cambio minimo.
5. Validar el riesgo principal, no toda la galaxia.
6. Comunicar estado cada bloque importante.
7. Registrar deuda y post-mortem si hubo incidente.

## Atajos permitidos

- Menos explicacion previa.
- Validacion manual si automatizar demora demasiado.
- Deploy autorizado por JOHN en N1 si esperar aumenta dano.

## Atajos prohibidos

- Tocar datos sin backup/plan.
- Ignorar auth/secrets.
- Borrar sin rollback.
- Declarar estable sin smoke.

## Output minimo

```text
Urgencia: [N1|N2]
Objetivo inmediato: [contener|diagnosticar|fix]
Accion: [concreta]
Validacion rapida: [resultado]
Pendiente post-crisis: [lista]
```

