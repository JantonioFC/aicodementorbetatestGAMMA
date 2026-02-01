/**
 * LLM-as-Judge Evaluator
 * Usa el propio LLM para evaluar la calidad de las lecciones.
 * Basado en skill: llm-evaluation
 */
const geminiRouter = require('../ai/router/GeminiRouter');

class LLMJudgeEvaluator {
    constructor() {
        this.criteriaPrompt = `Eres un evaluador experto en contenido educativo para niños de 10-14 años.

Evalúa la siguiente lección en escala 1-10 para cada criterio:

**LECCIÓN A EVALUAR:**
{lesson_content}

**CONTEXTO DEL CURRÍCULO:**
{curriculum_context}

**CRITERIOS DE EVALUACIÓN:**

1. **Fidelidad al Currículo (1-10):** ¿La lección cubre el tema del pomodoro?
2. **Calidad Pedagógica (1-10):** ¿Es apropiada para la edad? ¿Usa analogías efectivas?
3. **Libre de Código (1-10):** ¿Evita conceptos de programación pura como printf/scanf/gcc?
4. **Engagement (1-10):** ¿Mantendría la atención de un niño?
5. **Estructura (1-10):** ¿Tiene buena organización (intro, desarrollo, ejemplos, quiz)?

**RESPONDE ÚNICAMENTE EN JSON:**
{
    "faithfulness": <1-10>,
    "pedagogy": <1-10>,
    "codeFree": <1-10>,
    "engagement": <1-10>,
    "structure": <1-10>,
    "overall": <promedio redondeado>,
    "reasoning": "<breve explicación de 1-2 oraciones>",
    "improvements": ["<sugerencia 1>", "<sugerencia 2>"]
}`;
    }

    /**
     * Evalúa una lección usando LLM-as-Judge.
     * @param {Object} lesson - { contenido, quiz }
     * @param {Object} context - { texto_del_pomodoro, tematica_semanal }
     * @returns {Promise<Object>} Evaluación del juez
     */
    async evaluate(lesson, context) {
        const lessonContent = lesson.contenido || lesson.content || '';
        const curriculumContext = `
Tema semanal: ${context.tematica_semanal || 'N/A'}
Concepto del día: ${context.concepto_del_dia || 'N/A'}
Pomodoro: ${context.texto_del_pomodoro || 'N/A'}
        `.trim();

        const prompt = this.criteriaPrompt
            .replace('{lesson_content}', lessonContent.substring(0, 3000))
            .replace('{curriculum_context}', curriculumContext);

        try {
            const response = await geminiRouter.analyze({
                prompt,
                responseType: 'json',
                temperature: 0.1 // Baja temperatura para consistencia
            });

            const evaluation = this._parseResponse(response);
            return {
                success: true,
                ...evaluation,
                evaluatorType: 'llm-judge',
                model: 'gemini-1.5-flash'
            };
        } catch (error) {
            console.error('[LLMJudge] Error:', error.message);
            return {
                success: false,
                error: error.message,
                evaluatorType: 'llm-judge'
            };
        }
    }

    /**
     * Compara dos lecciones (pairwise comparison).
     * @param {Object} lessonA 
     * @param {Object} lessonB 
     * @param {Object} context 
     * @returns {Promise<Object>}
     */
    async compareLessons(lessonA, lessonB, context) {
        const prompt = `Compara estas dos lecciones sobre "${context.texto_del_pomodoro}".

**LECCIÓN A:**
${lessonA.contenido?.substring(0, 2000)}

**LECCIÓN B:**
${lessonB.contenido?.substring(0, 2000)}

¿Cuál es mejor para un estudiante de 12 años? Responde en JSON:
{
    "winner": "A" o "B" o "tie",
    "reasoning": "<explicación breve>",
    "confidence": <1-10>
}`;

        try {
            const response = await geminiRouter.analyze({
                prompt,
                responseType: 'json',
                temperature: 0.1
            });
            return this._parseResponse(response);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    _parseResponse(response) {
        if (typeof response === 'object') return response;

        try {
            const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            return { rawResponse: response };
        } catch (e) {
            return { rawResponse: response, parseError: e.message };
        }
    }
}

// Exportar singleton
const llmJudgeEvaluator = new LLMJudgeEvaluator();
module.exports = { llmJudgeEvaluator, LLMJudgeEvaluator };
