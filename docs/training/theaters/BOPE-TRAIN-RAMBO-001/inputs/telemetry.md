# Telemetry Snapshot

| Fuente | Estado | Nota |
|---|---|---|
| API Gateway | timeout | health endpoint sin respuesta en 12s |
| Frontend Monitor | degraded | login colgado; landing viva |
| DB Sentinel | healthy | conexiones estables |
| Worker Queue | stalled | sin consumo desde hace 7 minutos |

## Lectura

- No parece una caida pura de base de datos.
- No parece un bug exclusivamente visual.
- El punto de corte probable esta entre gateway, autenticacion y cola de eventos.
