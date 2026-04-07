# Adapter Interface - Orchestrator v1

Este documento define la interfaz que deben implementar los adaptadores de Claude, Codex y Gemini para asegurar la interoperabilidad dentro de BOPE.

## Interfaz Base de Adaptador

```typescript
export interface IAgentAdapter {
  /**
   * Ejecuta una tarea dada un input normalizado.
   * El adaptador se encarga de la transformación de prompts específicos del modelo.
   */
  execute(input: NormalizedInput): Promise<NormalizedOutput>;
}

/**
 * Input normalizado que recibe el adaptador desde el Orchestrator.
 */
export interface NormalizedInput {
  mission: {
    slug: string;
    objective: string;
    metadata: Record<string, any>;
  };
  task: {
    id: string;
    payload: Record<string, any>;
    history: Array<{ agent: string, content: string }>;
  };
}

/**
 * Output normalizado que devuelve el adaptador al Orchestrator.
 */
export interface NormalizedOutput {
  /** 
   * Los 3 campos obligatorios para que decideNextAgent() funcione 
   */
  reasoning: string;  // El 'reason' del contrato de handoff.
  status: 'completed' | 'failed' | 'handoff'; // El estado del resultado.
  nextAgent: string;  // El 'to' o el fallback a 'COMMANDER'.

  /** Datos adicionales */
  result: string;
  tokens: {
    in: number;
    out: number;
  };
  latencyMs: number;
}
```

## Campos Obligatorios para `decideNextAgent()`

1. **`reasoning`**: Explicación en lenguaje natural de por qué se tomó la decisión. Es la evidencia lógica del agente.
2. **`status`**: Define si el flujo continúa (`handoff`), si se completó el objetivo o si hubo un fallo que requiere intervención.
3. **`nextAgent`**: El identificador del agente receptor (p. ej. `Gemini`, `Codex`, `Claude` o `COMMANDER`). 

## Reglas de Implementación
- **Aislamiento:** El adaptador no debe tener acceso directo a la base de datos (Neon). Solo opera con los objetos de entrada.
- **Tratamiento de Errores:** Cualquier error de la API externa (timeout, rate limit) debe ser capturado y devuelto como un objeto `NormalizedOutput` con `status: 'failed'` y `nextAgent: 'COMMANDER'`.
- **Timeout:** Debe respetar el límite de 60s de Vercel Pro, lanzando el error antes de que la plataforma lo corte de forma abrupta.
