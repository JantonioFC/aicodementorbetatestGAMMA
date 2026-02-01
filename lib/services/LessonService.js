import { geminiRouter } from '../ai/router/GeminiRouter';
import { logger } from '../utils/logger';
import { TEMPLATE_PROMPT_UNIVERSAL, buildLessonPromptMessages, SYSTEM_PROMPT } from '../prompts/LessonPrompts';
import { buildStorytellingPrompt, PERSONALITY_MODIFIERS } from '../prompts/StorytellingPrompts';
import { weekRepository } from '../repositories/WeekRepository';
import { contentRetriever } from '../rag/ContentRetriever';
import { sessionRepository } from '../repositories/SessionRepository';
import { GEMINI_PRO_BUDGET } from '../utils/TokenBudgetManager';
import { lessonEvaluator } from '../evaluation/LessonEvaluator';
import { llmJudgeEvaluator } from '../evaluation/LLMJudgeEvaluator';
import { multimodalService } from '../multimodal/MultimodalService';
import { userEntityMemory } from '../memory/UserEntityMemory';
import { contextWindowManager } from '../context/ContextWindowManager';
import { v4 as uuidv4 } from 'uuid';

export class LessonService {

    /**
     * Genera una lección granular basada en el contexto del pomodoro
     * @param {Object} params - Parámetros de generación
     * @param {number} params.semanaId - ID de la semana
     * @param {number} params.dia - Día (1-5)
     * @param {number} params.pomodoroIndex - Índice del pomodoro (0-N)
     * @param {string} params.userId - ID del usuario (opcional)
     * @param {boolean} params.enrichWithMultimodal - Añadir diagramas (opcional)
     * @param {boolean} params.useStorytellingPrompt - Usar prompts con storytelling (opcional)
     * @param {boolean} params.useLLMJudge - Usar LLM-as-Judge para evaluación (opcional)
     */
    async generateLesson({
        semanaId,
        dia,
        pomodoroIndex,
        userId = null,
        enrichWithMultimodal = false,
        useStorytellingPrompt = true,
        useLLMJudge = false
    }) {
        try {
            const lessonId = uuidv4();

            // 1. Obtener Contexto (Data Layer Access)
            const contexto = await this._getGranularContext(semanaId, dia, pomodoroIndex);

            // 2. Validar Coherencia Contextual (Business Logic)
            const validation = this._validateContextualCoherence(contexto);
            if (!validation.isValid) {
                logger.warn('[LessonService] Advertencias de coherencia contextual', validation.warnings);
            }

            // 3. Obtener Contexto Enriquecido con RAG
            const ragContext = contentRetriever.buildPromptContext(
                semanaId,
                dia - 1,  // ContentRetriever usa 0-indexed
                pomodoroIndex
            );
            logger.info('[LessonService] RAG Context obtenido', { ragContext: ragContext.substring(0, 100) + '...' });

            // 3.5 Obtener Contexto de Sesión (Memory Injection)
            let sessionContext = '';
            let sessionId = null;
            if (userId) {
                const session = sessionRepository.getOrCreateActiveSession(userId, semanaId);
                sessionId = session.id;
                sessionContext = sessionRepository.buildContextSummary(session.id);
                logger.info('[LessonService] Session Context obtenido', { sessionId });
            }

            // 3.6 Obtener Perfil del Estudiante (Entity Memory - NEW)
            let studentProfile = '';
            if (userId) {
                studentProfile = userEntityMemory.buildPromptContext(userId);
                if (studentProfile) {
                    logger.info('[LessonService] Student Profile obtenido', {
                        hasProfile: true,
                        profileLength: studentProfile.length
                    });
                }
            }

            // 4. Construir Prompt con CoT y Storytelling (NEW)
            let finalPrompt;
            let systemPrompt = SYSTEM_PROMPT;

            if (useStorytellingPrompt) {
                // Usar nuevo prompt con Chain-of-Thought y narrativa
                finalPrompt = buildStorytellingPrompt(contexto, {
                    studentProfile,
                    ragContext
                });
                logger.info('[LessonService] Usando Storytelling Prompt con CoT');
            } else {
                // Prompt legacy
                finalPrompt = this._buildPrompt(contexto);
            }

            // 4.5 Optimizar Context Window (Serial Position - NEW)
            const optimized = contextWindowManager.optimizeContext({
                criticalInstructions: 'NUNCA generes código real. El estudiante tiene 12 años.',
                systemPrompt,
                currentQuery: finalPrompt,
                fewShotExamples: null, // Ya incluidos en LessonPrompts
                ragContext,
                studentProfile,
                sessionHistory: sessionContext,
                reminderEnd: 'Verifica: sin código, analogías apropiadas, quiz de 5 preguntas con 4 opciones.'
            });

            logger.info('[LessonService] Context optimizado', optimized.usage);

            // 4.6 Aplicar Token Budget Manager
            const budgetResult = GEMINI_PRO_BUDGET.fitWithinBudget({
                system: systemPrompt,
                session: sessionContext,
                rag: ragContext,
                user: optimized.optimizedPrompt
            });

            if (budgetResult.wasAdjusted) {
                logger.warn('[LessonService] Prompt ajustado por budget', {
                    original: budgetResult.originalTokens,
                    final: budgetResult.finalTokens,
                    adjustments: budgetResult.adjustments
                });
            }

            // 5. Llamar a IA (AI Layer)
            const aiResponse = await geminiRouter.analyze({
                code: optimized.optimizedPrompt,
                language: 'markdown',
                phase: 'lesson-generation',
                analysisType: 'lesson',
                systemPrompt: budgetResult.components.system,
                userPrompt: budgetResult.components.user
            });

            // 6. Validar y Post-procesar Respuesta
            let lessonData = typeof aiResponse.analysis === 'string'
                ? JSON.parse(aiResponse.analysis.replace(/```json/g, '').replace(/```/g, ''))
                : aiResponse.analysis;

            // 7. Evaluar calidad de la lección (Dual Evaluation - NEW)
            const heuristicEval = lessonEvaluator.evaluateAndSave(
                lessonId,
                lessonData,
                contexto,
                ragContext,
                sessionId,
                userId
            );

            let llmJudgeEval = null;
            if (useLLMJudge) {
                llmJudgeEval = await llmJudgeEvaluator.evaluate(lessonData, contexto);
                logger.info('[LessonService] LLM-Judge evaluación', {
                    overall: llmJudgeEval.overall,
                    reasoning: llmJudgeEval.reasoning?.substring(0, 100)
                });
            }

            logger.info('[LessonService] Lección evaluada', {
                lessonId,
                heuristicScore: heuristicEval.scores.overall,
                llmJudgeScore: llmJudgeEval?.overall || 'N/A',
                passed: heuristicEval.passed
            });

            // 8. Enriquecer con multimodal si está habilitado
            if (enrichWithMultimodal) {
                lessonData = await multimodalService.enrichLesson(
                    lessonData,
                    contexto,
                    { includeDiagram: true }
                );
                logger.info('[LessonService] Lección enriquecida con multimodal');
            }

            // 9. Loguear interacción en sesión (para memoria futura)
            if (sessionId) {
                sessionRepository.logInteraction(sessionId, 'LESSON_GENERATED', {
                    lessonId,
                    topic: contexto.texto_del_pomodoro,
                    semana: semanaId,
                    dia: dia,
                    pomodoro: pomodoroIndex,
                    score: heuristicEval.scores.overall,
                    llmJudgeScore: llmJudgeEval?.overall
                });
            }

            // 9.5 Actualizar Entity Memory con el tema estudiado (NEW)
            if (userId) {
                userEntityMemory.set(userId, 'interest', contexto.texto_del_pomodoro, true, {
                    source: 'lesson',
                    confidence: 0.5
                });
            }

            return {
                success: true,
                data: lessonData,
                metadata: {
                    lessonId,
                    contexto,
                    sessionId,
                    evaluation: {
                        heuristic: {
                            score: heuristicEval.scores.overall,
                            passed: heuristicEval.passed,
                            details: heuristicEval.scores
                        },
                        llmJudge: llmJudgeEval ? {
                            overall: llmJudgeEval.overall,
                            details: {
                                faithfulness: llmJudgeEval.faithfulness,
                                pedagogy: llmJudgeEval.pedagogy,
                                codeFree: llmJudgeEval.codeFree,
                                engagement: llmJudgeEval.engagement,
                                structure: llmJudgeEval.structure
                            },
                            reasoning: llmJudgeEval.reasoning,
                            improvements: llmJudgeEval.improvements
                        } : null
                    },
                    budgetUsed: {
                        wasAdjusted: budgetResult.wasAdjusted,
                        tokens: budgetResult.finalTokens
                    },
                    contextOptimization: optimized.usage,
                    features: {
                        storytellingPrompt: useStorytellingPrompt,
                        llmJudge: useLLMJudge,
                        multimodal: enrichWithMultimodal,
                        entityMemory: !!studentProfile
                    }
                }
            };

        } catch (error) {
            logger.error('[LessonService] Error generando lección', error);
            throw error;
        }
    }

    /**
     * Registra resultado de quiz para actualizar Entity Memory.
     * @param {string} userId 
     * @param {string} topic 
     * @param {boolean} correct 
     */
    recordQuizResult(userId, topic, correct) {
        if (!userId) return;
        userEntityMemory.updateFromQuiz(userId, topic, correct);
        logger.info('[LessonService] Quiz result recorded', { userId, topic, correct });
    }

    async _getGranularContext(semanaId, dia, pomodoroIndex) {
        // Lógica extraída de generate-lesson.js
        console.log(`🔍 [LessonService] Extrayendo contexto: S${semanaId}/D${dia}/P${pomodoroIndex}`);

        // Use Repository
        const semanaEncontrada = weekRepository.getWeekDetails(semanaId);
        if (!semanaEncontrada) throw new Error(`Semana ${semanaId} no encontrada`);

        const diaData = semanaEncontrada.esquema_diario?.[dia - 1];
        if (!diaData) throw new Error(`Día ${dia} no encontrado`);

        const textoPomodoro = diaData.pomodoros?.[pomodoroIndex];
        if (!textoPomodoro) throw new Error(`Pomodoro ${pomodoroIndex} no encontrado`);

        return {
            tematica_semanal: semanaEncontrada.titulo_semana,
            concepto_del_dia: diaData.concepto,
            texto_del_pomodoro: textoPomodoro
        };
    }

    _buildPrompt(contexto) {
        return TEMPLATE_PROMPT_UNIVERSAL
            .replace(/{tematica_semanal}/g, contexto.tematica_semanal)
            .replace(/{concepto_del_dia}/g, contexto.concepto_del_dia)
            .replace(/{texto_del_pomodoro}/g, contexto.texto_del_pomodoro);
    }

    /**
     * Construye el prompt con contexto RAG inyectado.
     * @param {Object} contexto - Contexto básico
     * @param {string} ragContext - Contexto enriquecido del currículo
     * @returns {string} Prompt final
     */
    _buildPromptWithRAG(contexto, ragContext) {
        const basePrompt = this._buildPrompt(contexto);

        // Inyectar RAG antes del prompt principal
        return `${ragContext}\n\n---\n\n${basePrompt}`;
    }

    _validateContextualCoherence(contexto) {
        const { tematica_semanal, concepto_del_dia, texto_del_pomodoro } = contexto;
        const warnings = [];
        const errors = [];

        // Detectar términos problemáticos (CS50 knowledge leak)
        const problematicTerms = [
            'printf', 'scanf', 'c programming', 'command line', 'terminal',
            'python', 'javascript', 'java', 'compiler', 'gcc',
            'variables', 'functions', 'loops', 'arrays'
        ];

        // Términos esperados para Scratch
        const expectedScratchTerms = [
            'scratch', 'sprite', 'bloques', 'drag', 'drop', 'visual',
            'pensamiento computacional', 'algoritmo', 'secuencia',
            'repetición', 'condicional', 'evento'
        ];

        const contextText = `${tematica_semanal} ${concepto_del_dia} ${texto_del_pomodoro}`.toLowerCase();

        // ❌ Verificar ausencia de términos problemáticos
        const foundProblematic = problematicTerms.filter(term =>
            contextText.includes(term.toLowerCase())
        );

        if (foundProblematic.length > 0) {
            errors.push(`CRÍTICO: Detectados términos de CS50 textual: ${foundProblematic.join(', ')}`);
        }

        // ✅ Verificar presencia de términos esperados para Scratch
        if (contextText.includes('cs50') || contextText.includes('semana 0')) {
            const foundExpected = expectedScratchTerms.filter(term =>
                contextText.includes(term.toLowerCase())
            );

            if (foundExpected.length === 0) {
                warnings.push(`ADVERTENCIA: CS50 Semana 0 detectado pero sin términos de Scratch`);
            }
        }

        // 🔍 Verificar coherencia entre niveles del contexto
        if (tematica_semanal && concepto_del_dia && texto_del_pomodoro) {
            const temaWords = tematica_semanal.toLowerCase().split(' ');
            const conceptWords = concepto_del_dia.toLowerCase().split(' ');
            const pomodoroWords = texto_del_pomodoro.toLowerCase().split(' ');

            const commonWords = temaWords.filter(word =>
                conceptWords.includes(word) || pomodoroWords.includes(word)
            );

            if (commonWords.length === 0) {
                warnings.push('ADVERTENCIA: Posible incoherencia entre niveles de contexto');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

export const lessonService = new LessonService();
