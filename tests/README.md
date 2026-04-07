# Tests BOPE Visual Code Runtime

Este directorio contiene los tests unitarios para el proyecto BOPE Visual Code Runtime.

## Estructura

```
tests/
├── __init__.py
├── README.md
└── test_mission_parser.py    # Tests para el módulo de parsing de misiones
```

## Ejecutar los Tests

### Instalar Dependencias

```bash
pip install -e ".[dev]"
```

### Ejecutar Todos los Tests

```bash
pytest
```

### Ejecutar Tests con Verbose

```bash
pytest -v
```

### Ejecutar Tests con Cobertura

```bash
pytest --cov=bope_agents --cov-report=term-missing
```

### Ejecutar Tests Específicos

```bash
pytest tests/test_mission_parser.py
pytest tests/test_mission_parser.py::TestExtractValue
pytest tests/test_mission_parser.py::TestExtractValue::test_extract_basic_value
```

## Cobertura Actual

| Módulo | Cobertura |
|--------|-----------|
| `bope_agents.mission_parser` | 100% |

## Test Mission Parser

El módulo `test_mission_parser.py` contiene 23 tests organizados en 4 clases:

### `TestExtractValue` (5 tests)
Tests para la función `_extract_value()` que extrae valores individuales:
- Extracción básica de valores
- Manejo de espacios extras
- Valores no encontrados
- Caracteres especiales en labels
- Valores multilínea

### `TestExtractSection` (7 tests)
Tests para la función `_extract_section()` que extrae listas de items:
- Secciones simples
- Espacios extras en items
- Secciones vacías
- Secciones no encontradas
- Secciones al final del documento
- Ignora líneas que no son items de lista
- Manejo de caracteres especiales

### `TestParseMission` (7 tests)
Tests para la función principal `parse_mission()`:
- Parsing de misión completa
- Misión sin frente (usa "mixto" por defecto)
- Misión con campos mínimos
- Eliminación de puntos finales en el frente
- Secciones multilínea
- String vacío
- Ejemplo real del sistema BOPE

### `TestEdgeCases` (4 tests)
Tests de casos especiales:
- Sensibilidad a mayúsculas/minúsculas
- Manejo de Unicode
- Diferentes tipos de saltos de línea
- Items de lista anidados

## Agregar Nuevos Tests

Al agregar nuevos tests:

1. Crea un archivo `test_<modulo>.py` en este directorio
2. Importa pytest: `import pytest`
3. Organiza los tests en clases descriptivas
4. Usa nombres descriptivos para los métodos de test
5. Incluye docstrings explicando qué se está testeando
6. Ejecuta los tests antes de hacer commit

### Ejemplo:

```python
import pytest
from bope_agents.mi_modulo import mi_funcion


class TestMiFuncion:
    """Tests para mi_funcion."""

    def test_caso_basico(self):
        """Test del caso básico de uso."""
        result = mi_funcion("input")
        assert result == "expected"

    def test_caso_edge(self):
        """Test de un caso edge."""
        result = mi_funcion("")
        assert result == ""
```

## Convenciones

- Usar `assert` para verificaciones
- Organizar tests en clases por función/módulo testeado
- Nombres de test descriptivos que explican qué se testea
- Un assert principal por test (cuando sea posible)
- Usar fixtures de pytest para setup/teardown cuando sea necesario
- Documentar cada test con docstrings

## CI/CD

Los tests se ejecutan automáticamente en:
- Pre-commit (local)
- Pull requests
- Pushes a main

Para configurar pre-commit localmente:

```bash
# TODO: Agregar configuración de pre-commit hooks
```
