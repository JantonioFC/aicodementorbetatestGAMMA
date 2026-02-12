/**
 * LLM-as-Judge Evaluator
 * Usa el propio LLM para evaluar la calidad de las lecciones.
 * Basado en skill: llm-evaluation
 */
import { geminiRouter } from '../ai/router/GeminiRouter';
import { logger } from '../observability/Logger';

export interface LLMEvaluationResult {
    success: boolean;
    faithfulness?: number;
    pedagogy?: number;
    codeFree?: number;
    engagement?: number;
    structure?: number;
    overall?: number;
    reasoning?: string;
    improvements?: string[];
    error?: string;
    evaluatorType: string;
    model?: string;
}

export interface ComparisonResult {
    winner: 'A' | 'B' | 'tie';
    reasoning: string;
    confidence: number;
    success?: boolean;
    error?: string;
}

export class LLMJudgeEvaluator {
    private criteriaPrompt: string;

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
     */
    async evaluate(lesson: { content?: string; contenido?: string }, context: { tematica_semanal?: string; concepto_del_dia?: string; texto_del_pomodoro?: string }): Promise<LLMEvaluationResult> {
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
                userPrompt: prompt,
                analysisType: 'json'
            });

            const evaluation = this._parseResponse(response.analysis) as Partial<LLMEvaluationResult>;
            return {
                success: true,
                faithfulness: evaluation.faithfulness,
                pedagogy: evaluation.pedagogy,
                codeFree: evaluation.codeFree,
                engagement: evaluation.engagement,
                structure: evaluation.structure,
                overall: evaluation.overall,
                reasoning: evaluation.reasoning,
                improvements: evaluation.improvements,
                evaluatorType: 'llm-judge',
                model: 'gemini-1.5-flash'
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('[LLMJudge] Error', { error: message });
            return {
                success: false,
                error: message,
                evaluatorType: 'llm-judge'
            };
        }
    }

    /**
     * Compara dos lecciones (pairwise comparison).
     */
    async compareLessons(lessonA: { contenido?: string }, lessonB: { contenido?: string }, context: { texto_del_pomodoro?: string }): Promise<ComparisonResult> {
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
                userPrompt: prompt,
                analysisType: 'json'
            });
            const result = this._parseResponse(response.analysis) as unknown as ComparisonResult;
            return {
                winner: result.winner || 'tie',
                reasoning: result.reasoning || '',
                confidence: result.confidence || 0,
                success: true
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                winner: 'tie',
                reasoning: message,
                confidence: 0,
                success: false,
                error: message
            };
        }
    }

    private _parseResponse(response: unknown): Record<string, unknown> {
        if (typeof response === 'object' && response !== null) return response as Record<string, unknown>;

        const responseText = String(response);
        try {
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]) as Record<string, unknown>;
            }
            return { rawResponse: responseText };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            return { rawResponse: responseText, parseError: message };
        }
    }
}

// Exportar singleton
export const llmJudgeEvaluator = new LLMJudgeEvaluator();
