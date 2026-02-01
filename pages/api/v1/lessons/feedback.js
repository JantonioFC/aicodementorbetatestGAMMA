/**
 * API Endpoint: POST /api/v1/lessons/feedback
 * Recibe feedback del usuario sobre una lección generada.
 * Parte de Phase 6: Analytics Feedback Loop
 */
import db from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, lessonId, sessionId, rating, wasHelpful, difficulty, comment } = req.body;

        // Validación básica
        if (!userId || !lessonId || !rating) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId, lessonId, and rating are required.'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Rating must be between 1 and 5.'
            });
        }

        const validDifficulties = ['TOO_EASY', 'JUST_RIGHT', 'TOO_HARD'];
        if (difficulty && !validDifficulties.includes(difficulty)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Difficulty must be one of: ${validDifficulties.join(', ')}`
            });
        }

        // Insertar feedback
        const feedbackId = uuidv4();
        db.run(
            `INSERT INTO lesson_feedback (id, user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [feedbackId, userId, lessonId, sessionId || null, rating, wasHelpful ? 1 : 0, difficulty || null, comment || null]
        );

        // Calcular estadísticas agregadas para esta lección
        const stats = db.get(
            `SELECT 
                AVG(rating) as avgRating, 
                COUNT(*) as totalReviews,
                SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpfulCount
             FROM lesson_feedback WHERE lesson_id = ?`,
            [lessonId]
        );

        return res.status(201).json({
            success: true,
            feedbackId,
            lessonStats: {
                averageRating: parseFloat(stats.avgRating?.toFixed(2)) || rating,
                totalReviews: stats.totalReviews || 1,
                helpfulPercentage: stats.totalReviews
                    ? Math.round((stats.helpfulCount / stats.totalReviews) * 100)
                    : (wasHelpful ? 100 : 0)
            }
        });

    } catch (error) {
        console.error('[Feedback API Error]', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
