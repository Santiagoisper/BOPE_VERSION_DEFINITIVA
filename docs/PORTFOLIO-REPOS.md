# Portfolio de repositorios

Mapa operativo de repositorios de Santiago.

Este documento separa activos reales, productos potenciales, archivo historico y repos descartables.

## 01 - Strategic

Repositorios con valor estrategico directo, negocio real o continuidad operativa.

- `BOPE_VERSION_DEFINITIVA`
- `innova-scoring`
- `innovawebpage`
- `Ichtys-Facturador-Exterior`
- `latamseg`
- `Cuentaspersonales`

## 02 - Operations / Product Potential

Repositorios con stack real, valor operativo o posible continuidad como producto.

- `Asistente-CRF`
- `portalcinmeconsultorios`

Criterio:

- no archivar sin revision funcional
- revisar variables de entorno
- revisar despliegue
- revisar flujos principales
- revisar si siguen conectados con operaciones reales

## 03 - Archive / Historical

Repositorios que pueden conservar valor intelectual, documental, tecnico o historico, pero no deben recibir trabajo productivo nuevo salvo decision expresa.

### BOPE legacy

- `BOPE`
- `BOPE_VERSION_DEFINITIVA` absorbe el tronco operativo; este repo viejo queda historico
- `BOPE-VISUAL-CODE`
- `BOPE_DOTFILES`
- `bope-war-room`
- `bope-agents`

### IA / escritura / memoria / experimentos

- `CLAUDIO`
- `Proyecto-Memoria-Santi`
- `Memoria_cap_V`
- `radar-diario-ia`
- `monday-learning-skill`
- `agora-platform`
- `customer-reviews-ai-summary-nextjs-vercel`

### Tecnico preservado

- `patient-services-app`

## 99 - Delete candidates

Repositorios sin valor estrategico visible, usados como prueba o sandbox descartable.

- `PRUEBA`
- `PRUEBA2`

Regla: borrar solo despues de verificar que no contienen archivos no replicados ni despliegues vivos.

## Reglas de gobierno

1. No crear repos nuevos si el trabajo puede vivir dentro de un repo activo existente.
2. Todo BOPE nuevo entra en `BOPE_VERSION_DEFINITIVA`.
3. Todo Innova nuevo debe vivir en repos Innova salvo excepcion fundada.
4. Los repos de archivo no reciben trabajo nuevo.
5. Antes de borrar, revisar contenido minimo, despliegues y secretos.
6. Si un experimento vuelve a tener vida, se promueve de Archive a Operations o Strategic con README actualizado.
