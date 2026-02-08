import db from '../../../../lib/db';
import { createApiHandler, sendSuccess, sendError } from '../../../../lib/api/APIWrapper';
import AuthLocal from '../../../../lib/auth-local';

/**
 * Endpoint para obtener analíticas detalladas de feedback
 */
async function handler(req, res) {
    // 1. Verify Admin Authentication
    const token = req.cookies['ai-code-mentor-auth'] || req.headers.authorization;
    const auth = AuthLocal.verifyToken(token);

    if (!auth.isValid || auth.role !== 'admin') {
        return sendError(res, 'Admin access required', 403);
    }

    try {
        // 1. Estadísticas generales
        const generalStats = db.get(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avgRating,
        SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpfulCount,
        (CAST(SUM(was_helpful) AS FLOAT) / COUNT(*)) * 100 as helpfulPercentage
      FROM lesson_feedback
    `);

        // 2. Desglose por dificultad
        const difficultyDistribution = db.all(`
      SELECT difficulty, COUNT(*) as count
      FROM lesson_feedback
      WHERE difficulty IS NOT NULL
      GROUP BY difficulty
    `);

        // 3. Últimos comentarios
        const recentComments = db.all(`
      SELECT f.comment, f.rating, f.created_at, u.email as user_email
      FROM lesson_feedback f
      JOIN user_profiles u ON f.user_id = u.id
      WHERE f.comment IS NOT NULL AND f.comment != ''
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

        // 4. Rating por día (últimos 7 días)
        const ratingTrend = db.all(`
      SELECT DATE(created_at) as date, AVG(rating) as avgRating, COUNT(*) as count
      FROM lesson_feedback
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

        return sendSuccess(res, {
            summary: generalStats,
            difficulty: difficultyDistribution,
            recentComments,
            trend: ratingTrend
        });
    } catch (error) {
        console.error('❌ [ANALYTICS-FEEDBACK] Error:', error);
        return sendError(res, 'Internal server error', 500);
    }
}

export default createApiHandler(handler);
