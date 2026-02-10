import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';
import { geminiRouter } from '../ai/router/GeminiRouter';
import { logger } from '../utils/logger';

/**
 * Technical Agent - Se enfoca en la precisión técnica, revisión de código y conceptos avanzados.
 */
export class TechnicalAgent implements BaseAgent {
    name = 'TechnicalAgent';
    role = 'technical_expert';

    async process(input: string, context: AgentContext): Promise<AgentResponse> {
        logger.info(`[TechnicalAgent] Procesando: ${context.topic}`);

        const prompt = `Actúa como un Ingeniero de Software Senior y experto en ${context.topic}.
Tu objetivo es asegurar la precisión técnica de la siguiente respuesta.

**SOLICITUD DEL USUARIO:** "${input}"
**TEMA:** ${context.topic}

**INSTRUCCIONES:**
1. Verifica que los fragmentos de código sean correctos y sigan mejores prácticas.
2. Si detectas imprecisiones técnicas, corrígelas.
3. Agrega comentarios técnicos valiosos o "Pro Tips" si es apropiado para el nivel ${context.difficulty}.
4. No pierdas el foco en el tema principal: ${context.topic}.

**RESPUESTA:**`;

        try {
            const response = await geminiRouter.analyze({
                code: '',
                language: context.language || 'es',
                phase: 'technical-review',
                analysisType: 'technical_check',
                systemPrompt: 'Eres un experto técnico en desarrollo de software y lenguajes de programación.',
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
        } catch (error: any) {
            logger.error(`[TechnicalAgent] Error: ${error.message}`);
            return {
                content: input,
                metadata: {
                    agentName: this.name,
                    confidence: 0.1,
                    role: this.role,
                    error: error.message
                }
            };
        }
    }
}
