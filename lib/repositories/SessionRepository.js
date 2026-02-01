/**
 * Session Repository
 * Gestiona la memoria conversacional para sesiones de aprendizaje.
 * Parte de Phase 6: AI & Data Maturity
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class SessionRepository {
    /**
     * Obtiene o crea una sesión activa para un usuario.
     * @param {string} userId 
     * @param {number} weekId - Semana actual del currículo
     * @returns {Object} La sesión activa
     */
    getOrCreateActiveSession(userId, weekId = null) {
        // Buscar sesión activa existente
        let session = db.get(
            'SELECT * FROM learning_sessions WHERE user_id = ? AND status = ? LIMIT 1',
            [userId, 'ACTIVE']
        );

        if (!session) {
            // Crear nueva sesión
            const newId = uuidv4();
            db.run(
                'INSERT INTO learning_sessions (id, user_id, week_id, status) VALUES (?, ?, ?, ?)',
                [newId, userId, weekId, 'ACTIVE']
            );
            session = db.get('SELECT * FROM learning_sessions WHERE id = ?', [newId]);
        }

        return session;
    }

    /**
     * Registra una interacción en la sesión actual.
     * @param {string} sessionId 
     * @param {string} type - LESSON_GENERATED, QUIZ_ANSWERED, etc.
     * @param {Object} content - Datos de la interacción
     * @param {number} tokensUsed - Tokens consumidos (opcional)
     */
    logInteraction(sessionId, type, content, tokensUsed = 0) {
        const id = uuidv4();
        db.run(
            `INSERT INTO session_interactions (id, session_id, interaction_type, content, tokens_used) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, sessionId, type, JSON.stringify(content), tokensUsed]
        );
        return id;
    }

    /**
     * Obtiene las últimas N interacciones de una sesión para construir contexto.
     * @param {string} sessionId 
     * @param {number} limit - Número máximo de interacciones
     * @returns {Array<Object>}
     */
    getRecentInteractions(sessionId, limit = 5) {
        const rows = db.query(
            `SELECT * FROM session_interactions 
             WHERE session_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [sessionId, limit]
        );

        // Parsear JSON content
        return rows.map(row => ({
            ...row,
            content: JSON.parse(row.content || '{}')
        }));
    }

    /**
     * Construye un resumen de contexto para inyectar en el prompt de la IA.
     * @param {string} sessionId 
     * @returns {string} Texto de contexto para el prompt
     */
    buildContextSummary(sessionId) {
        const interactions = this.getRecentInteractions(sessionId, 3);

        if (interactions.length === 0) {
            return "Esta es la primera interacción del estudiante en esta sesión.";
        }

        const summaryParts = interactions.map(i => {
            if (i.interaction_type === 'LESSON_GENERATED') {
                return `- Se generó una lección sobre: "${i.content.topic || 'tema desconocido'}"`;
            }
            if (i.interaction_type === 'QUIZ_ANSWERED') {
                const correct = i.content.is_correct ? 'correctamente' : 'incorrectamente';
                return `- El estudiante respondió ${correct} una pregunta de quiz.`;
            }
            return `- Interacción: ${i.interaction_type}`;
        });

        return `Historial reciente de la sesión:\n${summaryParts.join('\n')}`;
    }

    /**
     * Marca una sesión como completada.
     * @param {string} sessionId 
     */
    endSession(sessionId) {
        db.run(
            'UPDATE learning_sessions SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['COMPLETED', sessionId]
        );
    }

    /**
     * Obtiene estadísticas de la sesión.
     * @param {string} sessionId 
     * @returns {Object}
     */
    getSessionStats(sessionId) {
        const lessonsCount = db.get(
            `SELECT COUNT(*) as count FROM session_interactions 
             WHERE session_id = ? AND interaction_type = 'LESSON_GENERATED'`,
            [sessionId]
        );

        const quizzesCount = db.get(
            `SELECT COUNT(*) as count FROM session_interactions 
             WHERE session_id = ? AND interaction_type = 'QUIZ_ANSWERED'`,
            [sessionId]
        );

        const tokensTotal = db.get(
            'SELECT SUM(tokens_used) as total FROM session_interactions WHERE session_id = ?',
            [sessionId]
        );

        return {
            lessonsGenerated: lessonsCount?.count || 0,
            quizzesAnswered: quizzesCount?.count || 0,
            totalTokensUsed: tokensTotal?.total || 0
        };
    }
}

// Exportar singleton
const sessionRepository = new SessionRepository();
module.exports = { sessionRepository, SessionRepository };
