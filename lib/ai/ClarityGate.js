/**
 * Clarity Gate - Filtro de Relevancia Contextual
 * Evalúa si el contexto recuperado es suficiente y relevante para la consulta.
 * Actúa como "portero" antes de la generación para evitar alucinaciones.
 */
const geminiRouter = require('./router/GeminiRouter');

class ClarityGate {
    constructor() {
        this.relevanceThreshold = 0.7; // Mínimo score para pasar
    }

    /**
     * Evalúa la relevancia del contexto para una query dada.
     * @param {string} query - Lo que el usuario/sistema quiere generar
     * @param {string} context - El contexto recuperado por RAG
     * @returns {Promise<Object>} Resultado de evaluación { passed, score, reasoning }
     */
    async evaluate(query, context) {
        if (!context || context.length < 50) {
            return {
                passed: false,
                score: 0,
                reasoning: 'Context is empty or too short'
            };
        }

        const prompt = `Actúa como un juez de relevancia imparcial.
Evalúa si el CONTEXTO proporcionado contiene información suficiente y relevante para responder a la CONSULTA.

CONSULTA: "${query}"

CONTEXTO:
"${context.substring(0, 3000)}"

Responde SOLO en formato JSON:
{
    "score": <number 0-1, relevancia del contexto>,
    "missing_concepts": [<lista de conceptos clave faltantes>],
    "reasoning": "<breve explicación>"
}
`;

        try {
            const result = await geminiRouter.analyze({
                prompt,
                responseType: 'json',
                temperature: 0.1, // Baja temperatura para evaluación objetiva
                options: {
                    model: 'gemini-1.5-flash' // Modelo rápido y económico
                }
            });

            const evaluation = this._parseResult(result);

            return {
                passed: evaluation.score >= this.relevanceThreshold,
                score: evaluation.score,
                reasoning: evaluation.reasoning,
                missingConcepts: evaluation.missing_concepts || []
            };

        } catch (error) {
            console.warn('[ClarityGate] Evaluation failed:', error.message);
            // Fail open: ante error de API, dejar pasar para no bloquear, pero loguear
            return { passed: true, score: 0.5, reasoning: 'Evaluation failed, bypassing' };
        }
    }

    _parseResult(result) {
        try {
            if (typeof result === 'string') {
                const match = result.match(/\{[\s\S]*\}/);
                return match ? JSON.parse(match[0]) : { score: 0.5 };
            }
            return result;
        } catch {
            return { score: 0.5 };
        }
    }
}

// Exportar singleton
const clarityGate = new ClarityGate();
module.exports = { clarityGate, ClarityGate };
