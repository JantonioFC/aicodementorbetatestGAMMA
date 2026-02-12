import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../observability/Logger';

/**
 * Servicio para gestionar el feedback de los alumnos
 */
export interface FeedbackInput {
    user_id: string;
    lesson_id: string;
    session_id?: string;
    rating: number;
    was_helpful: boolean;
    difficulty: number;
    comment?: string;
}

/**
 * Interfaces de Dominio para Feedback
 */

export interface LessonStats {
    total_responses: number;
    avg_rating: number;
    helpful_count: number;
    helpful_percentage: number;
}

export interface FeedbackEntry extends FeedbackInput {
    id: string;
    user_email?: string;
    created_at: string;
}

const feedbackService = {
    /**
     * Guarda una valoración de lección
     */
    async saveFeedback({ user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment }: FeedbackInput): Promise<{ id: string; success: boolean }> {
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
        } catch (error: unknown) {
            logger.error('FeedbackService error saving feedback', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    },

    /**
     * Obtiene estadísticas de feedback para una lección específica
     */
    async getLessonStats(lesson_id: string): Promise<LessonStats | undefined> {
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
            return db.get<LessonStats>(query, [lesson_id]);
        } catch (error: unknown) {
            logger.error('FeedbackService error getting lesson stats', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    },

    /**
     * Obtiene todos los feedbacks del sistema (Admin)
     */
    async getAllFeedback(limit = 100): Promise<FeedbackEntry[]> {
        const query = `
      SELECT f.*, u.email as user_email
      FROM lesson_feedback f
      JOIN user_profiles u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT ?
    `;

        try {
            return db.query<FeedbackEntry>(query, [limit]);
        } catch (error: unknown) {
            logger.error('FeedbackService error fetching all feedback', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
};

export default feedbackService;
