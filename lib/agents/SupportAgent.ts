import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';
import { geminiRouter } from '../ai/router/GeminiRouter';
import { logger } from '../observability/Logger';

/**
 * Support Agent - Utiliza el método socrático para guiar al alumno sin darle la respuesta directa.
 * Especializado en resolución de dudas y soporte pedagógico.
 */
export class SupportAgent implements BaseAgent {
    name = 'SupportAgent';
    role = 'socratic_tutor';

    async process(input: string, context: AgentContext): Promise<AgentResponse> {
        logger.info(`[SupportAgent] Procesando duda para: ${context.topic}`);

        const prompt = `Actúa como un tutor socrático experto en programación.
Tu objetivo es ayudar al alumno a resolver su duda SIN darle la respuesta directamente.
En su lugar, debes guiarlo mediante preguntas que lo obliguen a razonar.

**CONTEXTO DEL ALUMNO:**
- **Tema:** ${context.topic}
- **Nivel:** ${context.difficulty}
- **Idioma:** ${context.language}

**DUDA DEL ALUMNO:** 
"${input}"

**REGLAS DE ORO DEL MÉTODO SOCRÁTICO:**
1. **NUNCA** entregues el código corregido o la respuesta teórica final de inmediato.
2. Identifica el concepto erróneo subyacente y pregunta sobre él.
3. Usa analogías si el alumno parece bloqueado.
4. Si el alumno está muy frustrado, dale una pequeña pista, pero termina con una pregunta.
5. Mantén un tono paciente, alentador y curioso.

**INSTRUCCIONES DE RESPUESTA:**
Responde de forma amable y directa, usando Markdown para destacar conceptos.
Enfócate en UN solo paso de razonamiento a la vez.

**TU RESPUESTA:**`;

        try {
            const response = await geminiRouter.analyze({
                code: '', // Puede estar vacío si es una duda teórica
                language: context.language || 'es',
                phase: 'support-chat',
                analysisType: 'explanation',
                systemPrompt: 'Eres un tutor socrático que guía mediante preguntas. No das respuestas directas.',
                messages: [{ role: 'user', content: prompt }]
            });

            return {
                content: response.analysis.feedback || JSON.stringify(response.analysis),
                metadata: {
                    agentName: this.name,
                    confidence: 0.9,
                    role: this.role,
                    model: response.metadata.model
                }
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[SupportAgent] Error: ${message}`);
            return {
                content: `Interesante pregunta. Antes de profundizar, ¿qué es lo que más te llama la atención sobre ${context.topic}? (Error en el agente: ${message})`,
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
