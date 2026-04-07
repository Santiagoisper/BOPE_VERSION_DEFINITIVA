# Estandar Minimo de Input BOPE v1

Toda orden debe cumplir los 5 items antes de ser aceptada
por cualquier agente. Si uno falla, devolver al COMMANDER.

| # | Criterio | Cumple | No cumple |
|---|---|---|---|
| 1 | Destinatario explicito | Aceptar | "falta destinatario" |
| 2 | Entregable concreto verificable | Aceptar | "entregable ambiguo" |
| 3 | Mision de referencia | Aceptar | "falta mision de referencia" |
| 4 | Sin contradiccion con orden activa | Aceptar | "conflicto con tarea activa" |
| 5 | Alcance dentro del mandato del rol | Aceptar | "fuera de mandato - redirigir a [rol]" |
