import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';
import { geminiRouter } from '../ai/router/GeminiRouter';
import { masteryAnalyticsService } from '../services/MasteryAnalyticsService';
import { logger } from '../observability/Logger';

/**
 * ProactiveMentorAgent - Analiza el progreso del alumno y sugiere el siguiente paso.
 * No espera a que el usuario pregunte; genera consejos orientados al crecimiento.
 */
export class ProactiveMentorAgent implements BaseAgent {
    name = 'ProactiveMentorAgent';
    role = 'proactive_mentor';

    async process(input: string, context: AgentContext): Promise<AgentResponse> {
        // En este agente, el 'input' puede ser ignorado o usado como punto de partida si viene de un disparador.
        logger.info(`[ProactiveMentor] Generando consejo proactivo para ${context.userId}`);

        try {
            // 1. Obtener recomendaciones reales desde el servicio de analíticas
            const recommendations = context.userId
                ? await masteryAnalyticsService.getRecommendations(context.userId)
                : [];

            const recomendacionTexto = recommendations.length > 0
                ? `He notado que podrías reforzar: ${recommendations.join(', ')}.`
                : "¡Estás haciendo un excelente trabajo explorando nuevos temas!";

            const prompt = `Actúa como un mentor AI proactivo y motivador.
Tu objetivo es dar un "Tip del Mentor" basado en el progreso actual del alumno.

**DATOS DEL ALUMNO:**
- **Tema Actual:** ${context.topic}
- **Recomendación basada en datos:** ${recomendacionTexto}
- **Nivel:** ${context.difficulty}

**INSTRUCCIONES:**
1. Sé breve y motivador (máximo 3 frases).
2. Usa un tono cercano, como un entrenador personal.
3. Propón un pequeño reto relacionado con la recomendación o el tema actual.
4. No esperes una respuesta, es un mensaje de "un solo sentido" para mostrar valor.

**TU CONSEJO (Markdown):**`;

            const response = await geminiRouter.analyze({
                code: '',
                language: context.language || 'es',
                phase: 'proactive-mentoring',
                analysisType: 'explanation',
                systemPrompt: 'Eres un mentor proactivo que da consejos cortos y accionables.',
                messages: [{ role: 'user', content: prompt }]
            });

            return {
                content: response.analysis.feedback || JSON.stringify(response.analysis),
                metadata: {
                    agentName: this.name,
                    confidence: 0.85,
                    role: this.role,
                    model: response.metadata.model,
                    recommendations
                }
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[ProactiveMentor] Error: ${message}`);
            return {
                content: `¡Sigue así! Estás dominando ${context.topic} a un gran ritmo.`,
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
