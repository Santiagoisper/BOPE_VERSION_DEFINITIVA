# CATALOGO DE ENTRENAMIENTO

Este catalogo convierte el material de entrenamiento existente en memoria reutilizable para BOPE Visual Code. Los archivos fuente siguen viviendo en la raiz del repo como material bruto; este indice los clasifica para que JOHN, PX, HOUSE, WINSTON y MARCO puedan consultarlos sin ensuciar la mision activa.

## Regla

- un entrenamiento no se usa como fuente de verdad del estado operativo
- un entrenamiento si puede convertirse en doctrina, checklist o patron tactico
- antes de una mision real, JOHN puede revisar este catalogo si el escenario se parece a uno ya entrenado
- despues de cada simulacro o incidente real, WINSTON y MARCO deben extraer aprendizaje hacia `MEMORIA-TACTICA.md`

## Material disponible

| Archivo | Tipo | Uso doctrinal |
|---|---|---|
| `CHECKLIST_OPERATIVA_INCIDENTE_CLIENTE.md` | checklist | respuesta operativa ante incidente cliente |
| `EJERCICIO_EJECUTABLE_INCIDENTE_CLIENTE_TRN.md` | ejercicio | simulacro ejecutable de incidente |
| `MENU_ENTRENAMIENTO_TRN_CYBER.md` | indice | menu de escenarios de entrenamiento |
| `TRN_CATALOGO_CYBER_GLOBAL_022.md` | catalogo | biblioteca amplia de escenarios cyber |
| `TRN_RAMBO_API_PANEL_DB_TERCEROS_001.md` | simulacro | integracion API, panel, DB y terceros |
| `TRN_RAMBO_ATAQUE_APLICACION_CLIENTE_001.md` | simulacro | ataque sobre aplicacion cliente |
| `TRN_RAMBO_INTRUSOS_HACKERS.md` | simulacro | intrusion y contencion |
| `TRN_RAMBO_SABOTAJE_COMUNICACIONES_001.md` | simulacro | perdida o sabotaje de comunicaciones |
| `TRN_RAMBO_SALA_CRISIS_CLIENTE_001.md` | simulacro | crisis operativa frente a cliente |
| `TRN_RAMBO_TEATRO_OPERACIONES_CLIENTE_001.md` | simulacro | orquestacion de crisis en entorno cliente |
| `TRN_TEMPLATE_MISION_ENTRENAMIENTO.md` | template | plantilla base para nuevos entrenamientos |

## Como se reutiliza

1. JOHN detecta parecido entre la mision real y un escenario entrenado.
2. PX resume el patron util y lo separa del ruido narrativo.
3. HOUSE toma el checklist si hay validaciones o reproduccion tecnica.
4. WINSTON registra que entrenamiento fue consultado.
5. MARCO convierte la leccion en doctrina si aplica.

## Salida esperada

Cuando un entrenamiento aporte valor a una mision real, debe quedar escrito:

- que archivo se consulto
- que patron se reutilizo
- que ajuste hizo JOHN en la estrategia
- que aprendizaje se suma a `MEMORIA-TACTICA.md`
