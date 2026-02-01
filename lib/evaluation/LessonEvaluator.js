/**
 * Lesson Evaluator
 * Evalúa automáticamente la calidad de las lecciones generadas.
 * Parte de Phase 7: Priority Corrections
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class LessonEvaluator {
    constructor() {
        // Términos prohibidos (hallucination markers para CS50)
        this.prohibitedTerms = [
            'printf', 'scanf', 'gcc', 'compile', 'main()',
            'int main', 'return 0', '#include', 'stdlib',
            'comando de terminal', 'línea de comandos'
        ];

        // Pesos para el score general
        this.weights = {
            faithfulness: 0.25,
            relevance: 0.20,
            length: 0.15,
            structure: 0.25,
            noHallucination: 0.15
        };
    }

    /**
     * Evalúa una lección generada.
     * @param {Object} lesson - { contenido, quiz }
     * @param {Object} context - { texto_del_pomodoro, tematica_semanal, concepto_del_dia }
     * @param {string} ragContext - Contexto RAG inyectado
     * @returns {Object} Resultado de la evaluación
     */
    evaluate(lesson, context, ragContext = '') {
        const content = lesson.contenido || lesson.content || '';
        const quiz = lesson.quiz || [];

        // 1. Faithfulness: ¿Menciona el tema del pomodoro?
        const faithfulness = this._evaluateFaithfulness(content, context.texto_del_pomodoro);

        // 2. Relevance: ¿Usa términos del contexto?
        const relevance = this._evaluateRelevance(content, context, ragContext);

        // 3. Length: ¿Cumple mínimo de palabras?
        const length = this._evaluateLength(content);

        // 4. Structure: ¿Tiene título, ejemplos, quiz?
        const structure = this._evaluateStructure(content, quiz);

        // 5. No Hallucination: ¿Evita términos prohibidos?
        const noHallucination = this._evaluateNoHallucination(content);

        // Calcular score general
        const overallScore =
            faithfulness.score * this.weights.faithfulness +
            relevance.score * this.weights.relevance +
            length.score * this.weights.length +
            structure.score * this.weights.structure +
            noHallucination.score * this.weights.noHallucination;

        return {
            scores: {
                faithfulness: faithfulness.score,
                relevance: relevance.score,
                length: length.score,
                structure: structure.score,
                noHallucination: noHallucination.score,
                overall: Math.round(overallScore)
            },
            details: {
                faithfulness: faithfulness.details,
                relevance: relevance.details,
                length: length.details,
                structure: structure.details,
                noHallucination: noHallucination.details
            },
            passed: overallScore >= 70,
            wordCount: length.details.wordCount,
            hasExamples: structure.details.hasExamples,
            hasQuiz: quiz.length >= 3
        };
    }

    /**
     * Evalúa y guarda el resultado en la base de datos.
     * @param {string} lessonId 
     * @param {Object} lesson 
     * @param {Object} context 
     * @param {string} ragContext 
     * @param {string} sessionId 
     * @param {string} userId 
     * @returns {Object}
     */
    evaluateAndSave(lessonId, lesson, context, ragContext = '', sessionId = null, userId = null) {
        const result = this.evaluate(lesson, context, ragContext);

        const id = uuidv4();
        db.run(`
            INSERT INTO lesson_evaluations (
                id, lesson_id, session_id, user_id,
                faithfulness_score, relevance_score, length_score, 
                structure_score, no_hallucination_score, overall_score,
                details, word_count, has_examples, has_quiz
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, lessonId, sessionId, userId,
            result.scores.faithfulness,
            result.scores.relevance,
            result.scores.length,
            result.scores.structure,
            result.scores.noHallucination,
            result.scores.overall,
            JSON.stringify(result.details),
            result.wordCount,
            result.hasExamples ? 1 : 0,
            result.hasQuiz ? 1 : 0
        ]);

        return { evaluationId: id, ...result };
    }

    // ============================================
    // MÉTODOS DE EVALUACIÓN INDIVIDUALES
    // ============================================

    _evaluateFaithfulness(content, pomodoroTopic) {
        const contentLower = content.toLowerCase();
        const topicWords = pomodoroTopic.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        let matchedWords = 0;
        for (const word of topicWords) {
            if (contentLower.includes(word)) matchedWords++;
        }

        const matchRate = topicWords.length > 0 ? matchedWords / topicWords.length : 0;
        const score = Math.min(100, Math.round(matchRate * 100));

        return {
            score,
            details: {
                topicWords: topicWords.length,
                matchedWords,
                matchRate: Math.round(matchRate * 100) + '%'
            }
        };
    }

    _evaluateRelevance(content, context, ragContext) {
        const contentLower = content.toLowerCase();

        // Extraer términos clave del contexto RAG
        const contextTerms = new Set();
        const ragLower = (ragContext + ' ' + context.tematica_semanal + ' ' + context.concepto_del_dia).toLowerCase();
        const words = ragLower.match(/\b[a-záéíóúñ]{4,}\b/g) || [];
        words.forEach(w => contextTerms.add(w));

        let matchedTerms = 0;
        for (const term of contextTerms) {
            if (contentLower.includes(term)) matchedTerms++;
        }

        const matchRate = contextTerms.size > 0 ? matchedTerms / contextTerms.size : 0;
        const score = Math.min(100, Math.round(matchRate * 150)); // Boost porque no todos los términos son necesarios

        return {
            score,
            details: {
                contextTerms: contextTerms.size,
                matchedTerms,
                matchRate: Math.round(matchRate * 100) + '%'
            }
        };
    }

    _evaluateLength(content) {
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        const minWords = 800;

        let score;
        if (wordCount >= minWords) {
            score = 100;
        } else if (wordCount >= minWords * 0.7) {
            score = 80;
        } else if (wordCount >= minWords * 0.5) {
            score = 60;
        } else {
            score = Math.round((wordCount / minWords) * 50);
        }

        return {
            score,
            details: {
                wordCount,
                minRequired: minWords,
                percentage: Math.round((wordCount / minWords) * 100) + '%'
            }
        };
    }

    _evaluateStructure(content, quiz) {
        let score = 0;
        const checks = {
            hasTitle: /^#\s+.+/m.test(content) || content.includes('**'),
            hasSubtitles: /^#{2,3}\s+.+/m.test(content) || (content.match(/\*\*[^*]+\*\*/g) || []).length >= 3,
            hasExamples: content.includes('Ejemplo') || content.includes('ejemplo') || content.includes('```'),
            hasAnalogy: content.includes('Analogía') || content.includes('analogía') || content.includes('Imagina'),
            hasQuiz: quiz.length >= 3,
            quizHasOptions: quiz.every(q => q.opciones && q.opciones.length >= 4)
        };

        if (checks.hasTitle) score += 15;
        if (checks.hasSubtitles) score += 15;
        if (checks.hasExamples) score += 25;
        if (checks.hasAnalogy) score += 15;
        if (checks.hasQuiz) score += 20;
        if (checks.quizHasOptions) score += 10;

        return {
            score,
            details: checks
        };
    }

    _evaluateNoHallucination(content) {
        const contentLower = content.toLowerCase();
        const foundProhibited = [];

        for (const term of this.prohibitedTerms) {
            if (contentLower.includes(term.toLowerCase())) {
                foundProhibited.push(term);
            }
        }

        const score = foundProhibited.length === 0 ? 100 : Math.max(0, 100 - (foundProhibited.length * 25));

        return {
            score,
            details: {
                prohibitedFound: foundProhibited,
                count: foundProhibited.length
            }
        };
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    /**
     * Obtiene estadísticas de evaluación para un rango de tiempo.
     * @param {number} days - Últimos N días
     * @returns {Object}
     */
    getStats(days = 7) {
        const stats = db.get(`
            SELECT 
                COUNT(*) as totalEvaluations,
                AVG(overall_score) as avgScore,
                MIN(overall_score) as minScore,
                MAX(overall_score) as maxScore,
                SUM(CASE WHEN overall_score >= 70 THEN 1 ELSE 0 END) as passedCount,
                AVG(word_count) as avgWordCount
            FROM lesson_evaluations 
            WHERE created_at >= datetime('now', '-${days} days')
        `, []);

        return {
            ...stats,
            passRate: stats.totalEvaluations > 0
                ? Math.round((stats.passedCount / stats.totalEvaluations) * 100)
                : 0
        };
    }
}

// Exportar singleton
const lessonEvaluator = new LessonEvaluator();
module.exports = { lessonEvaluator, LessonEvaluator };
