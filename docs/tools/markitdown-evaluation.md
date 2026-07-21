# MarkItDown Evaluation Report

Origen: `C:/Users/Santiago/source/repos/Santiagoisper/Markitdown-lab/markitdown-evaluation.md`.

**Herramienta:** Microsoft MarkItDown v0.1.5  
**Fecha:** 2026-06-01  
**Objetivo:** Evaluar viabilidad como pieza en pipelines de RAG y análisis documental  
**Entorno:** Windows 11 / Python 3.12.13 (via uv) / sin servicios externos

---

## Setup y comandos usados

```bash
# Crear entorno aislado
uv venv --python 3.12 .venv

# Instalar markitdown con todas las dependencias opcionales
uv pip install "markitdown[all]"

# Convertir un archivo
.venv/Scripts/python -c "
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert('input/dummy.html')
print(result.text_content)
"

# O via CLI (instalado con el paquete)
.venv/Scripts/markitdown input/dummy.html
```

---

## Resultados por formato

### HTML → ✅ Excelente

**Comando:** `md.convert("input/dummy.html")`  
**Tiempo:** 15ms | **Salida:** 353 chars / 19 líneas

```markdown
# Annual Report 2025
## Executive Summary
This is a **bold** statement with a [link to example](https://example.com).
## Data Table
| Region | Revenue | Growth |
| --- | --- | --- |
| North | $1.2M | +12% |
...
## Key Points
* Revenue grew by 15% YoY
```

| Criterio | Resultado |
|---|---|
| Títulos (H1/H2) | ✅ Preservados con jerarquía correcta |
| Tablas | ✅ Convertidas a pipe tables perfectas |
| Listas | ✅ Preservadas como `*` items |
| Links | ✅ `[texto](url)` correcto |
| Negrita/itálica | ✅ Preservadas |

**Para RAG:** Ideal. Salida limpia, semántica completa, sin ruido.

---

### CSV → ✅ Excelente

**Tiempo:** 2ms | **Salida:** 216 chars / 6 líneas

```markdown
| product | category | price | stock |
| --- | --- | --- |--- |
| Widget A | Electronics | 29.99 | 150 |
```

| Criterio | Resultado |
|---|---|
| Headers | ✅ Primera fila como cabecera |
| Datos | ✅ Todos preservados |
| Tipos numéricos | ✅ Sin conversión ni pérdida |

**Para RAG:** Ideal. Datos tabulares directamente utilizables por LLM.

---

### XLSX → ✅ Muy bueno

**Tiempo:** 15ms | **Salida:** 441 chars / 14 líneas

```markdown
## Budget
| Quarter | Budget | Actual | Variance | Notes |
| --- | --- | --- | --- | --- |
| Q1 2025 | 50000 | 48000 | -2000 | Under budget |
...

## Team
| Name | Role | Level |
```

| Criterio | Resultado |
|---|---|
| Múltiples hojas | ✅ Cada hoja como sección H2 |
| Headers | ✅ Fila bold reconocida como cabecera |
| Números | ✅ Sin formato de moneda (50000, no $50,000) |
| Fórmulas | ⚠️ Extrae valor calculado, no la fórmula |

**Para RAG:** Muy bueno. Pérdida menor: formatos de número y fórmulas.  
**Nota:** Números sin símbolo de moneda ni separador de miles — importante si el contexto financiero es crítico.

---

### PPTX → ✅ Bueno

**Tiempo:** 14ms | **Salida:** 402 chars / 20 líneas

```markdown
<!-- Slide number: 1 -->
# Agent Engineering Methodology
Compound Engineering — EveryInc
June 2025

<!-- Slide number: 2 -->
# The Problem
Agents improvise without structure
No plan → no traceability
```

| Criterio | Resultado |
|---|---|
| Títulos de slide | ✅ Como H1 |
| Número de slide | ✅ Como comentario HTML `<!-- Slide number: N -->` |
| Texto de slides | ✅ Preservado |
| Jerarquía de bullets | ⚠️ Niveles aplanados — sub-bullets al mismo nivel |
| Notas del presentador | ❌ No extraídas |
| Imágenes/diagramas | ❌ Ignorados (sin ALT text) |

**Para RAG:** Bueno para recuperar contenido textual. Pierdes jerarquía de bullets y notas.  
**Caso de uso válido:** Búsqueda semántica sobre presentaciones corporativas.

---

### DOCX → ✅ Bueno (con una limitación notable)

**Tiempo:** 133ms | **Salida:** 638 chars / 24 líneas

```markdown
Technical Specification     ← título sin markup de heading

# 1. Overview              ← headings numerados correctos
...
|  |  |  |                 ← fila vacía extra
| --- | --- | --- |
| Component | Language | Role |   ← header en fila 2, no en fila 1
```

| Criterio | Resultado |
|---|---|
| Headings con `Heading 1-3` | ✅ Preservados como `#` `##` `###` |
| Título del documento | ⚠️ Sin `#` — queda como texto plano |
| Listas | ✅ Como `*` items |
| Tablas | ⚠️ Header row en fila 2 en lugar de fila 1 (fila vacía primera) |
| Links | ⚠️ URL plana, no `[texto](url)` |

**Limitación documentada:** El header de tabla DOCX no siempre se detecta como `<th>` — genera una fila vacía inicial que confunde a los LLM.  
**Para RAG:** Funcional pero requiere post-procesamiento para tablas con headers de Word.

---

### PDF → ⚠️ Parcial

**Tiempo:** 19ms | **Salida:** 646 chars / 14 líneas

```markdown
Technical Overview
Introduction
This document provides a technical overview...
Architecture Rules
(cid:127) Write a plan before modifying code.   ← artefacto de encoding
(cid:127) Request review for architecture...
Component Summary
| Component    | Language   | Purpose            |
```

| Criterio | Resultado |
|---|---|
| Texto corrido | ✅ Extraído correctamente |
| Tablas | ✅ Preservadas (caso ideal — tabla simple) |
| Headings | ❌ No hay markup `#` — todo texto plano |
| Listas con bullets especiales | ❌ `(cid:127)` en lugar del símbolo — artefacto de fuente PDF |
| Estructura de páginas | ❌ No preservada |
| PDFs escaneados (imagen) | ❌ Sin OCR en modo local |

**Causa del `(cid:127)`:** El bullet `•` en el PDF usa una fuente personalizada (Symbol/Wingdings). pdfminer.six no resuelve el glyph y emite el CID raw.  
**Para RAG:** Aceptable para PDFs bien formados con texto seleccionable. Inutilizable para PDFs escaneados o con fuentes embebidas no estándar sin postproceso.

---

### JSON → ⚠️ Passthrough

**Tiempo:** 2ms | **Salida:** 581 chars / 31 líneas

```markdown
{
  "project": "agent-lab-test",
  "version": "1.0.0",
  ...
}
```

| Criterio | Resultado |
|---|---|
| Contenido | ✅ Completo y sin pérdida |
| Estructura | ⚠️ JSON verbatim — no convertido a prosa ni tabla |
| Código fence | ❌ No envuelto en ` ```json ``` ` |

**Observación:** MarkItDown no interpreta JSON — lo vuelca como texto plano. Un LLM puede parsear JSON válido, pero no está optimizado para chunk-based RAG.  
**Para RAG:** Funcional si el JSON es pequeño y el LLM puede razonarlo entero. Para JSON grande o anidado, mejor un preprocesador dedicado.

---

## Resumen de calidad

| Formato | Tiempo | Títulos | Tablas | Listas | Links | Veredicto RAG |
|---|---|---|---|---|---|---|
| HTML | 15ms | ✅ | ✅ | ✅ | ✅ | Excelente |
| CSV | 2ms | N/A | ✅ | N/A | N/A | Excelente |
| XLSX | 15ms | ✅ | ✅ | N/A | N/A | Muy bueno |
| PPTX | 14ms | ✅ | N/A | ⚠️ plano | N/A | Bueno |
| DOCX | 133ms | ⚠️ título | ⚠️ header | ✅ | ⚠️ URL plana | Bueno |
| PDF | 19ms | ❌ | ✅ simple | ❌ CID | N/A | Parcial |
| JSON | 2ms | N/A | N/A | N/A | N/A | Passthrough |

---

## Errores encontrados

| Error | Contexto | Severidad |
|---|---|---|
| `(cid:127)` en lugar de bullet | PDF con fuente Symbol | Media — artefacto visible para LLM |
| Fila vacía en tabla DOCX | Tabla con header bold | Baja — post-procesable |
| URL sin ancla en DOCX | Link sin hyperlink XML | Baja |
| `RuntimeWarning: ffmpeg` | Audio no disponible (esperado) | Info — no afecta conversión de docs |
| Título DOCX sin `#` | Estilo "Title" no mapeado | Baja |

---

## Limitaciones

1. **PDF sin OCR:** Solo funciona con PDFs de texto seleccionable. Documentos escaneados quedan vacíos.
2. **PDF con fuentes embebidas:** Bullets y caracteres especiales pueden aparecer como `(cid:N)`.
3. **DOCX tablas complejas:** Tablas con celdas combinadas, headers en múltiples filas o estilos custom se aplanan incorrectamente.
4. **PPTX jerarquía:** Sub-bullets pierden nivel — no hay `  -` para indentación.
5. **JSON/XML:** Passthrough sin conversión semántica. No útil para RAG de esquemas complejos.
6. **Imágenes:** No extraídas en modo local. Requiere configurar LLM plugin (llama_cpp, openai) para ALT text.
7. **Audio/Video:** Requiere ffmpeg + speech recognition — no disponible en entornos mínimos.
8. **Documentos grandes:** Sin chunking nativo — devuelve un string completo. Para RAG real necesitás langchain/llamaindex para splits.
9. **Codificación Windows:** Archivos guardados en UTF-8 pero legacy Office puede generar caracteres Latin-1.

---

## Riesgos de seguridad

| Riesgo | Descripción | Mitigación |
|---|---|---|
| **Macros embebidas** | DOCX/XLSX pueden contener VBA. MarkItDown no ejecuta macros (usa python-docx/openpyxl que no corren VBA), pero el archivo entra al proceso. | Bajo en modo local. Validar extensión antes de pasar archivos de origen desconocido. |
| **HTML con JS** | MarkItDown usa BeautifulSoup que parsea sin renderizar — scripts ignorados. | Bajo. No hay ejecución de JavaScript. |
| **PDF con enlaces maliciosos** | URLs en PDF son extraídas como texto, no seguidas. | Bajo. |
| **Path traversal** | `md.convert(user_input)` con input no sanitizado podría leer archivos del sistema. | Medio en API web. Sanitizar rutas antes de llamar convert(). |
| **DoS por archivos grandes** | Un XLSX de 100k filas o PDF de 1000 páginas puede consumir mucha RAM. | Medio en pipelines batch. Agregar límite de tamaño de archivo. |
| **Datos sensibles en logs** | El texto extraído puede contener PII si los documentos son corporativos. | No registrar `result.text_content` en logs de producción. |

---

## Veredicto: ADOPTAR (con condiciones)

### Adoptar para:
- **HTML, CSV, XLSX:** Calidad de salida directamente utilizable en RAG sin postproceso.
- **PPTX:** Válido para recuperación semántica de presentaciones corporativas. Aceptar pérdida de jerarquía.
- **DOCX:** Válido con postprocesamiento mínimo (limpiar fila vacía de tabla).

### Vigilar:
- **PDF:** Aceptable solo para PDFs bien formados. Agregar detección de `(cid:` para filtrar salidas corruptas. Para PDFs de alta criticidad, evaluar `pymupdf` como alternativa.
- **JSON/XML:** No usar MarkItDown — convertir directamente con jinja2 o un serializer a markdown estructurado.

### Razones para adoptar sobre alternativas:
- **0 dependencias de nube** — cumple la regla de no subir documentos.
- **Velocidad:** < 20ms para la mayoría de formatos. 133ms para DOCX es el más lento.
- **API simple:** una línea de Python, sin configuración de servidor.
- **Cobertura de formatos:** 20+ formatos documentados incluyendo audio, YouTube, Wikipedia.
- **Activamente mantenido** por Microsoft (repositorio con >37k stars, releases frecuentes).

### Patrón recomendado para RAG:

```python
from markitdown import MarkItDown
import re

md = MarkItDown()

def to_markdown(path: str) -> str | None:
    result = md.convert(path)
    text = result.text_content

    # Filtrar artefactos de PDF
    if "(cid:" in text:
        text = re.sub(r"\(cid:\d+\)", "•", text)

    # Limpiar filas vacías de tablas DOCX
    text = re.sub(r"^\|\s+\|\s+\|\s+\|.*\n", "", text, flags=re.MULTILINE)

    return text if text.strip() else None
```

---

*Evaluación realizada en entorno local aislado — sin servicios externos, sin archivos productivos.*
