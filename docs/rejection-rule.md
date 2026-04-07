# Regla de STOP - Criterios de Rechazo Operativo BOPE v1

CONDICION 1 - Ambiguedad estructural
Condicion: la tarea tiene dos interpretaciones validas y
           ejecutar una invalida la otra.
Accion: STOP total.
Mensaje: "[ROL] STOP - ambiguedad estructural.
          Interpretacion A: <x> / B: <y>
          Requiere decision del COMMANDER."

CONDICION 2 - Dependencia no resuelta
Condicion: la tarea depende de entregable de otro agente
           no confirmado como completado en DB.
Accion: STOP - esperar confirmacion.
Mensaje: "[ROL] STOP - dependencia pendiente.
          Necesito: <entregable> de <agente>.
          Reanudar cuando COMMANDER confirme cierre."

CONDICION 3 - Riesgo de dano irreversible
Condicion: ejecutar implica borrar, sobrescribir o
           deployar sin rollback posible.
Accion: STOP - solicitar confirmacion explicita.
Mensaje: "[ROL] STOP - accion irreversible detectada.
          Accion en riesgo: <descripcion>
          Requiere: 'CONFIRMO ACCION IRREVERSIBLE - [desc]'"

Regla inviolable: fallback ante cualquier STOP = COMMANDER.
