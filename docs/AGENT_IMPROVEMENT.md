
# Protocolo de Mejora Continua para Agente IA

**Objetivo**: Mejora sistemática del `SmartLessonGenerator` y el pipeline RAG.

## 1. Marco de Métricas (KPIs)

| Métrica | Definición | Objetivo | Frecuencia |
| :--- | :--- | :--- | :--- |
| **Puntaje de Claridad** | Promedio del `ClarityGate` (0.0-1.0). | > 0.85 | Diario |
| **Tasa de Reintentos** | % de generaciones que requieren >1 retry. | < 5% | Semanal |
| **Latencia** | Tiempo al Primer Token / Total. | < 5s (p95) | Tiempo Real |
| **Valoración Usuario** | Pulgar arriba/abajo en lecciones. | > 4.5/5 | Mensual |

## 2. Ciclo de Mejora (Kaizen para IA)

### Fase 1: Análisis (Semanal)
1.  **Extraer generaciones bajas** (Score < 0.7).
2.  **Etiquetar fallos**: Alucinación, Mal Formato, Contexto Irrelevante.
3.  **Identificar patrones**: Ej. "Falla seguido en temas de Recursividad".

### Fase 2: Ingeniería de Prompts (Quincenal)
1.  **Hipótesis**: "Añadir un ejemplo de recursividad genérico arreglará el fallo".
2.  **Test A/B**: Desplegar prompt `v2.1` vs `v2.0` al 50% de usuarios.
3.  **Eval**: Correr `LLMJudgeEvaluator` en set de pruebas.

### Fase 3: Ajuste RAG (Mensual)
1.  **Tamaño de Chunk**: Experimentar con 256 vs 512 tokens.
2.  **Reranker**: Evaluar rendimiento del cross-encoder.

## 3. Respuesta a Incidentes
*   Si **Puntaje de Claridad < 0.6** por 3 llamadas consecutivas:
    *   **ALERTA**: Notificación a Slack/Discord.
    *   **Fallback**: Cambiar a modelo más robusto (`gpt-4`) o plantilla simplificada.
