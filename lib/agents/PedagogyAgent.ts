import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';
import { geminiRouter } from '../ai/router/GeminiRouter';
import { logger } from '../observability/Logger';

/**
 * Pedagogy Agent - Asegura que el contenido sea educativo, estructurado y adaptado al nivel del alumno.
 */
export class PedagogyAgent implements BaseAgent {
    name = 'PedagogyAgent';
    role = 'pedagogical_expert';

    async process(input: string, context: AgentContext): Promise<AgentResponse> {
        logger.info(`[PedagogyAgent] Procesando: ${context.topic}`);

        const prompt = `Actúa como un experto en pedagogía para niños y principiantes en programación.
Tu objetivo es estructurar la siguiente respuesta de forma educativa.

**SOLICITUD DEL USUARIO:** "${input}"
**TEMA:** ${context.topic}
**DIFICULTAD:** ${context.difficulty}

**INSTRUCCIONES:**
1. Usa un tono motivador y claro.
2. Divide conceptos complejos en pasos pequeños.
3. Asegúrate de que la explicación use analogías adecuadas para el nivel ${context.difficulty}.
4. Si falta estructura (títulos, ejemplos), agrégala.

**RESPUESTA:**`;

        try {
            const response = await geminiRouter.analyze({
                code: '',
                language: context.language || 'es',
                phase: 'pedagogy-refinement',
                analysisType: 'explanation',
                systemPrompt: 'Eres un experto en pedagogía para programación inicial.',
                messages: [{ role: 'user', content: prompt }]
            });

            return {
                content: response.analysis.feedback || JSON.stringify(response.analysis),
                metadata: {
                    agentName: this.name,
                    confidence: 0.98,
                    role: this.role,
                    model: response.metadata.model
                }
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[PedagogyAgent] Error: ${message}`);
            return {
                content: input, // Fallback to original input
                metadata: {
                    agentName: this.name,
                    confidence: 0.1,
                    role: this.role,
                    error: message
                }
            };
        }
    }
}
