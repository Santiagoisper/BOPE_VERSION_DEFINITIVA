# Skill: Intel Phase

**Usar cuando:** hay que entender un repo, incidente, modulo, contrato o mision antes de tocar codigo.

## Regla

Leer primero, actuar despues. La fase de intel debe ser breve, orientada a decision y proporcional al riesgo.

## Procedimiento

1. Confirmar ubicacion y estado:
   - `git status`,
   - rama,
   - archivos relevantes,
   - instrucciones locales.
2. Detectar stack y comandos de validacion.
3. Encontrar el patron existente antes de inventar uno nuevo.
4. Identificar zonas de riesgo: datos, prod, auth, migraciones, costos, UX critica.
5. Definir plan minimo y evidencia de cierre.

## Output minimo

```text
Intel:
- Stack: [resumen]
- Estado: [git/health]
- Patron existente: [archivo/modulo]
- Riesgos: [lista]
- Plan minimo: [pasos]
```

## Limites

- No convertir intel en investigacion infinita.
- No modificar archivos durante la primera lectura salvo que la orden sea trivial.
- No asumir que docs viejos son canon si el codigo contradice.

