# Metricas Operativas BOPE v1

| Metrica | Aceptable | Critico | Quien mide | Campo DB |
|---|---|---|---|---|
| Latencia de handoff | < 60s | > 120s | Orchestrator | tasks.updated_at - created_at |
| Tasa de fallo por agente | < 10% | > 25% | PX semanal | fail_count / total |
| Escalamiento a COMMANDER | < 30% | > 60% | PX semanal | COUNT(awaiting_commander) |

Alerta: avg_latency_ms > 45.000ms sostenido = escalar
a COMMANDER por posible limite de timeout en Vercel.
