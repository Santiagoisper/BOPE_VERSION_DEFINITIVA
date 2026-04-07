# 🧪 Testing Guide - BOPE Visual Code

## ✅ Estado Actual de Tests

| Módulo | Tests | Cobertura | Estado |
|--------|-------|-----------|--------|
| `mission_parser.py` | 23 | **100%** | ✅ PASSING |

**Cobertura Total del Proyecto:** 29.08% (de 0% inicial)

## 🚀 Ejecución Rápida

### Ejecutar todos los tests
```bash
pytest
```

### Ejecutar con reporte de cobertura
```bash
pytest --cov=bope_agents --cov-report=term-missing
```

### Ejecutar tests específicos
```bash
# Solo tests de mission_parser
pytest tests/test_mission_parser.py

# Solo una clase de tests
pytest tests/test_mission_parser.py::TestParseMission

# Solo un test específico
pytest tests/test_mission_parser.py::TestParseMission::test_parse_complete_mission
```

## 📦 Instalación de Dependencias

```bash
# Instalar el paquete en modo desarrollo con dependencias de testing
pip install -e ".[dev]"
```

## 📊 Estructura de Tests

```
tests/
├── __init__.py
├── README.md                    # Documentación detallada
└── test_mission_parser.py       # 23 tests (100% coverage)
    ├── TestExtractValue         # 5 tests
    ├── TestExtractSection       # 7 tests
    ├── TestParseMission         # 7 tests
    └── TestEdgeCases            # 4 tests
```

## 🎯 Próximos Pasos

Módulos candidatos para agregar tests:

1. `tools/files.py` - Funciones de I/O de archivos
2. `tools/logs.py` - Sistema de logging
3. `config.py` - Configuración de paths
4. `agents/john.py` - Agente router principal
5. `training_runner.py` - Runner de entrenamientos

## 📝 Notas

- Los tests usan **pytest** como framework
- Configuración en `pyproject.toml`
- Coverage configurado para excluir archivos de test
- Todos los tests están pasando ✅

---

**Última actualización:** 2026-04-06  
**Total de tests:** 23  
**Tests pasando:** 23 ✅  
**Tests fallando:** 0
