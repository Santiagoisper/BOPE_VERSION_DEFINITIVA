# BOPE-CODEX-2026-007

## Titulo

Habilitacion de PDF en carga de adjuntos de evaluacion

## Commander

Santiago

## Mando operativo

JOHN RAMBO

## Objetivo

Permitir que el sitio adjunte archivos PDF en el cuestionario de evaluacion dentro de `innova-scoring`, sin imponer un limite de tamano desde la aplicacion.

## Criterio de exito

- el selector de archivos del sitio acepta PDF junto con los tipos ya existentes
- la validacion cliente deja de rechazar archivos `.pdf`
- la interfaz refleja correctamente que PDF es un tipo permitido
- la vista admin mantiene legible el tipo de archivo cargado

## Actores asignados

- JOHN RAMBO

## Ejecucion

Se intervino `client/src/pages/site/evaluation.tsx` para agregar `pdf` a la lista de extensiones validas, ampliar el atributo `accept` del input de archivos y actualizar el texto visible y el mensaje de rechazo.

Se ajusto `client/src/pages/admin/center-detail.tsx` para que la insignia del archivo use como fallback la extension del nombre y muestre el tipo en mayusculas, dejando mejor representados los PDFs y otros adjuntos.

## Resultado

El formulario de evaluacion ahora permite seleccionar y conservar PDFs junto con JPG, Excel, Word y TXT. La aplicacion no agrega un limite de tamano propio en este flujo; cualquier tope restante dependera de navegador, proxy o infraestructura de despliegue.

## Aprendizaje

En este flujo no existe subida binaria real: solo se persisten metadatos del archivo dentro de `answers`. Eso elimina un tope de tamano aplicativo en esta pantalla, pero tambien significa que una futura necesidad de descarga real exigira backend de almacenamiento.

## Bloqueos

- verificacion de build incompleta: `npm run build` falla porque el entorno actual no tiene `node_modules` instalados y `drizzle-kit` no esta disponible

## Sanciones

- ninguna

## Medallas

- ninguna
