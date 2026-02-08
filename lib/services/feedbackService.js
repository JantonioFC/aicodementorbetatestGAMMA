const db = require('../../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Servicio para gestionar el feedback de los alumnos
 */
const feedbackService = {
    /**
     * Guarda una valoración de lección
     */
    async saveFeedback({ user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment }) {
        const id = uuidv4();

        const query = `
      INSERT INTO lesson_feedback (
        id, user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id,
            user_id,
            lesson_id,
            session_id || null,
            rating,
            was_helpful ? 1 : 0,
            difficulty,
            comment || null
        ];

        try {
            db.run(query, params);
            return { id, success: true };
        } catch (error) {
            console.error('❌ [FEEDBACK-SERVICE] Error saving feedback:', error);
            throw error;
        }
    },

    /**
     * Obtiene estadísticas de feedback para una lección específica
     */
    async getLessonStats(lesson_id) {
        const query = `
      SELECT 
        COUNT(*) as total_responses,
        AVG(rating) as avg_rating,
        SUM(was_helpful) as helpful_count,
        (CAST(SUM(was_helpful) AS FLOAT) / COUNT(*)) * 100 as helpful_percentage
      FROM lesson_feedback
      WHERE lesson_id = ?
    `;

        try {
            return db.get(query, [lesson_id]);
        } catch (error) {
            console.error('❌ [FEEDBACK-SERVICE] Error getting lesson stats:', error);
            throw error;
        }
    },

    /**
     * Obtiene todos los feedbacks del sistema (Admin)
     */
    async getAllFeedback(limit = 100) {
        const query = `
      SELECT f.*, u.email as user_email
      FROM lesson_feedback f
      JOIN user_profiles u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT ?
    `;

        try {
            return db.all(query, [limit]);
        } catch (error) {
            console.error('❌ [FEEDBACK-SERVICE] Error fetching all feedback:', error);
            throw error;
        }
    }
};

module.exports = feedbackService;
