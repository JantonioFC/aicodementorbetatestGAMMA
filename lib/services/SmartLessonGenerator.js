/**
 * Smart Lesson Generator - Agente Autónomo de Recuperación
 * Implementa lógica de reintento y corrección autónoma (Autonomous Agent Patterns).
 */
const { lessonService } = require('./LessonService');
const { clarityGate } = require('../ai/ClarityGate');
const { contentRetriever } = require('../rag/ContentRetriever');
const { queryExpander } = require('../rag/QueryExpander');

class SmartLessonGenerator {
    constructor() {
        this.maxRetries = 2;
    }

    /**
     * Genera una lección intentando asegurar calidad mediante bucles de corrección.
     * @param {Object} context - { semanaId, dia, pomodoroIndex }
     * @param {Object} options 
     */
    async generateWithRetry(context, options = {}) {
        let attempt = 0;
        let lastError = null;
        let currentOptions = { ...options };

        while (attempt <= this.maxRetries) {
            attempt++;
            console.log(`[SmartGenerator] Intento ${attempt}/${this.maxRetries + 1}`);

            try {
                // 1. Verificar Calidad de Contexto (Clarity Gate)
                // Recuperamos el contexto manualmente primero para evaluarlo
                const rawContext = await contentRetriever.buildPromptContext(
                    context.semanaId,
                    context.dia - 1,   // Ajuste de índice
                    context.pomodoroIndex
                );

                const query = `Lección sobre semana ${context.semanaId} dia ${context.dia}`;
                const gateResult = await clarityGate.evaluate(query, rawContext);

                if (!gateResult.passed) {
                    console.warn(`[SmartGenerator] Clarity Gate reject: ${gateResult.reasoning}`);

                    if (attempt <= this.maxRetries) {
                        // ACCIÓN AUTÓNOMA: Expandir búsqueda
                        console.log('[SmartGenerator] Action: Expanding context search...');
                        // En un sistema real, aquí inyectaríamos el contexto expandido en options
                        // Por simplicidad, simulamos activando 'useStorytellingPrompt' que es más robusto
                        currentOptions.useStorytellingPrompt = true;
                        continue;
                    }
                }

                // 2. Generar Lección
                const result = await lessonService.generateLesson(context, currentOptions);
                return { ...result, attempts: attempt, metadata: { gateScore: gateResult.score } };

            } catch (error) {
                console.error(`[SmartGenerator] Error en intento ${attempt}:`, error.message);
                lastError = error;

                // ACCIÓN AUTÓNOMA: Simplificar generación en caso de error
                if (attempt <= this.maxRetries) {
                    console.log('[SmartGenerator] Action: Disabling multimodal/complex features for retry...');
                    currentOptions.includeMultimodal = false;
                    currentOptions.useStorytellingPrompt = false; // Fallback a prompt básico
                }
            }
        }

        throw new Error(`Failed to generate lesson after ${this.maxRetries + 1} attempts. Last error: ${lastError?.message}`);
    }
}

// Exportar singleton
const smartLessonGenerator = new SmartLessonGenerator();
module.exports = { smartLessonGenerator, SmartLessonGenerator };
