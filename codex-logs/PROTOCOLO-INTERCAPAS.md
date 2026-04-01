# PROTOCOLO INTERCAPAS BOPE - CODEX

Regla canonica de replica entre `Claude`, `Codex` y `Gemini`.

## Regla

- ninguna capa comparte memoria por reflejo
- toda replica debe dejar origen, id original, fecha y firma local
- la capa destino replica fielmente sin tocar registros de la capa origen
- si una replica doctrinal cambia el arranque, se actualizan el bootstrap y los registros canonicos del repo en la misma sesion

## Formato minimo de replica fiel

- `ORIGEN`
- `ID ORIGINAL`
- `FECHA`
- `ESTADO: replicado fiel`
- `FIRMA LOCAL`

## Estado de sincronizacion

- `UP TO DATE`: la capa local refleja la ultima replica canonica exigida
- `PENDING`: existe un hecho remoto aun no replicado
- `DIVERGENT`: la capa local y la remota discrepan en hechos ya cerrados

## Articulo 11 para noticias

Cuando una replica afecte medallas, sanciones o estructura del batallon, `WINSTON` comunica en `codex-logs/NOTICIAS-BATALLON.log`:

```text
ARTICULO 11 | FECHA | TEMA
ORIGEN:
ID ORIGINAL:
MEDIDA:
IMPACTO:
FIRMA:
```

## Rotacion

Si `codex-logs/NOTICIAS-BATALLON.log` supera 150 lineas, `WINSTON` archiva las entradas antiguas en `codex-logs/NOTICIAS-ARCHIVO-YYYY-MM.log` antes de publicar nuevas novedades.
