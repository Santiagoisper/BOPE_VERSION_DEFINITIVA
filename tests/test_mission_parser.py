"""Tests para el módulo mission_parser.

Este módulo contiene tests unitarios para las funciones de parsing de misiones,
incluyendo extracción de valores, secciones y el parsing completo de contexto de misión.
"""
import pytest

from bope_agents.mission_parser import _extract_value, _extract_section, parse_mission
from bope_agents.models import MissionContext


class TestExtractValue:
    """Tests para la función _extract_value que extrae valores simples."""

    def test_extract_basic_value(self):
        """Test extracción de valor básico."""
        text = "- ID mision: BOPE-001"
        result = _extract_value("ID mision", text)
        assert result == "BOPE-001"

    def test_extract_value_with_spaces(self):
        """Test extracción con espacios extras."""
        text = "- ID mision:    BOPE-001   "
        result = _extract_value("ID mision", text)
        assert result == "BOPE-001"

    def test_extract_value_not_found(self):
        """Test cuando el valor no existe."""
        text = "- Otro campo: valor"
        result = _extract_value("ID mision", text)
        assert result == ""

    def test_extract_value_with_special_chars(self):
        """Test extracción con caracteres especiales en el label."""
        text = "- Próximo paso: Continuar"
        result = _extract_value("Próximo paso", text)
        assert result == "Continuar"

    def test_extract_value_multiline(self):
        """Test que solo extrae la primera línea del valor."""
        text = """- Campo: valor1
- Otro: valor2"""
        result = _extract_value("Campo", text)
        assert result == "valor1"


class TestExtractSection:
    """Tests para la función _extract_section que extrae listas de items."""

    def test_extract_simple_section(self):
        """Test extracción de sección simple con items."""
        text = """## Restricciones
- No usar sudo
- No instalar paquetes

## Otra sección"""
        result = _extract_section("Restricciones", text)
        assert result == ["No usar sudo", "No instalar paquetes"]

    def test_extract_section_with_extra_spaces(self):
        """Test con espacios extras en los items."""
        text = """## Objetivo
-   Item con espacios  
-  Otro item   

## Siguiente"""
        result = _extract_section("Objetivo", text)
        assert result == ["Item con espacios", "Otro item"]

    def test_extract_section_empty(self):
        """Test cuando la sección está vacía."""
        text = """## Restricciones

## Otra sección"""
        result = _extract_section("Restricciones", text)
        assert result == []

    def test_extract_section_not_found(self):
        """Test cuando la sección no existe."""
        text = """## Objetivo
- Item 1"""
        result = _extract_section("Restricciones", text)
        assert result == []

    def test_extract_section_at_end(self):
        """Test extracción de última sección del documento."""
        text = """## Primera
- Item 1

## Criterio de cierre
- Condición 1
- Condición 2"""
        result = _extract_section("Criterio de cierre", text)
        assert result == ["Condición 1", "Condición 2"]

    def test_extract_section_ignores_non_list_items(self):
        """Test que ignora líneas que no son items de lista."""
        text = """## Objetivo
Este es un texto normal
- Item válido
Otro texto normal
- Otro item válido

## Siguiente"""
        result = _extract_section("Objetivo", text)
        assert result == ["Item válido", "Otro item válido"]

    def test_extract_section_with_special_chars(self):
        """Test sección con caracteres especiales."""
        text = """## Próximo paso
- Verificar configuración
- Ejecutar análisis

## Final"""
        result = _extract_section("Próximo paso", text)
        assert result == ["Verificar configuración", "Ejecutar análisis"]


class TestParseMission:
    """Tests para la función parse_mission que parsea el contexto completo."""

    def test_parse_complete_mission(self):
        """Test parsing de misión completa con todos los campos."""
        mission_text = """# Misión BOPE

- ID mision: BOPE-TRAIN-001

## Objetivo
- Analizar sistema de autenticación
- Identificar vulnerabilidades

## Frente principal esperado
- cyber

## Restricciones
- No modificar base de datos
- Solo modo lectura

## Criterio de cierre
- Reporte completo generado
- Vulnerabilidades documentadas

## Proximo paso
- Ejecutar escaneo inicial
"""
        result = parse_mission(mission_text)
        
        assert isinstance(result, MissionContext)
        assert result.mission_id == "BOPE-TRAIN-001"
        assert "Analizar sistema de autenticación" in result.objective
        assert "Identificar vulnerabilidades" in result.objective
        assert result.front == "cyber"
        assert len(result.restrictions) == 2
        assert "No modificar base de datos" in result.restrictions
        assert len(result.close_criteria) == 2
        assert "Reporte completo generado" in result.close_criteria
        assert "Ejecutar escaneo inicial" in result.next_step

    def test_parse_mission_missing_front(self):
        """Test que usa 'mixto' cuando falta el frente."""
        mission_text = """# Misión

- ID mision: TEST-001

## Objetivo
- Objetivo principal

## Frente principal esperado

## Criterio de cierre
- Completar tarea
"""
        result = parse_mission(mission_text)
        assert result.front == "mixto"

    def test_parse_mission_minimal(self):
        """Test parsing con campos mínimos."""
        mission_text = """- ID mision: MIN-001"""
        result = parse_mission(mission_text)
        
        assert result.mission_id == "MIN-001"
        assert result.objective == ""
        assert result.front == "mixto"
        assert result.restrictions == []
        assert result.close_criteria == []
        assert result.next_step == ""

    def test_parse_mission_strips_front_trailing_dots(self):
        """Test que elimina puntos y espacios finales del frente."""
        mission_text = """# Misión

- ID mision: TEST-002

## Frente principal esperado
- operaciones. 
"""
        result = parse_mission(mission_text)
        assert result.front == "operaciones"

    def test_parse_mission_multiline_sections(self):
        """Test que las secciones multi-item se unen correctamente."""
        mission_text = """# Misión

- ID mision: MULTI-001

## Objetivo
- Primera línea del objetivo
- Segunda línea del objetivo
- Tercera línea del objetivo

## Proximo paso
- Paso uno
- Paso dos
"""
        result = parse_mission(mission_text)
        
        assert "Primera línea del objetivo" in result.objective
        assert "Segunda línea del objetivo" in result.objective
        assert "Tercera línea del objetivo" in result.objective
        assert "\n" in result.objective  # Las líneas están separadas por newline
        
        assert "Paso uno" in result.next_step
        assert "Paso dos" in result.next_step

    def test_parse_mission_empty_string(self):
        """Test parsing de string vacío."""
        result = parse_mission("")
        
        assert result.mission_id == ""
        assert result.objective == ""
        assert result.front == "mixto"
        assert result.restrictions == []
        assert result.close_criteria == []
        assert result.next_step == ""

    def test_parse_mission_real_world_example(self):
        """Test con ejemplo realista del sistema BOPE."""
        mission_text = """# MISION ACTIVA

- ID mision: BOPE-TRAIN-RAMBO-001
- Fecha: 2026-04-05
- Estado: EN EJECUCION

## Objetivo
- Analizar aplicación web del cliente
- Identificar puntos de entrada
- Evaluar superficie de ataque
- Documentar hallazgos críticos

## Frente principal esperado
- cyber.

## Restricciones
- NO realizar modificaciones destructivas
- NO ejecutar exploits sin autorización
- Mantener logs detallados de todas las acciones
- Reportar inmediatamente cualquier hallazgo crítico

## Criterio de cierre
- Análisis completo de la aplicación
- Reporte técnico generado
- Briefing al comando BOPE
- Documentación archivada en logs/missions/

## Proximo paso
- Iniciar reconocimiento pasivo
- Mapear endpoints de la API
"""
        result = parse_mission(mission_text)
        
        assert result.mission_id == "BOPE-TRAIN-RAMBO-001"
        assert "Analizar aplicación web del cliente" in result.objective
        assert "Evaluar superficie de ataque" in result.objective
        assert result.front == "cyber"
        assert len(result.restrictions) == 4
        assert "NO realizar modificaciones destructivas" in result.restrictions
        assert len(result.close_criteria) == 4
        assert "Análisis completo de la aplicación" in result.close_criteria
        assert "Iniciar reconocimiento pasivo" in result.next_step
        assert "Mapear endpoints de la API" in result.next_step


class TestEdgeCases:
    """Tests para casos especiales y edge cases."""

    def test_case_sensitivity(self):
        """Test que las búsquedas respetan mayúsculas/minúsculas."""
        text = """## objetivo
- Item 1"""
        result = _extract_section("Objetivo", text)
        assert result == []  # No debe encontrar "objetivo" cuando busca "Objetivo"

    def test_unicode_handling(self):
        """Test manejo correcto de caracteres Unicode."""
        text = """## Próximo paso
- Verificación de señales
- Análisis térmico
- Búsqueda de patrones

## Siguiente"""
        result = _extract_section("Próximo paso", text)
        assert len(result) == 3
        assert "Verificación de señales" in result
        assert "Análisis térmico" in result

    def test_mixed_line_endings(self):
        """Test con diferentes tipos de saltos de línea."""
        text = "## Objetivo\n- Item 1\n- Item 2\n\n## Fin"
        result = _extract_section("Objetivo", text)
        assert result == ["Item 1", "Item 2"]

    def test_nested_list_items(self):
        """Test que items anidados se procesan correctamente."""
        text = """## Restricciones
- Restricción principal
  - Sub-restricción (no debe aparecer como item separado)
- Otra restricción

## Fin"""
        result = _extract_section("Restricciones", text)
        # Solo debe capturar los items que empiezan con "- " al inicio de línea (después de strip)
        assert "Restricción principal" in result
        assert "Otra restricción" in result
