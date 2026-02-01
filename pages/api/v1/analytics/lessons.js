/**
 * API Endpoint: GET /api/v1/analytics/lessons
 * Retorna estadísticas de lecciones generadas.
 */

import { analyticsService } from '../../../../lib/services/AnalyticsService';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { days = 30 } = req.query;

        const lessonsPerDay = analyticsService.getLessonsPerDay(Number(days));
        const scoreDistribution = analyticsService.getScoreDistribution();
        const activityByWeek = analyticsService.getActivityByWeek();

        res.status(200).json({
            success: true,
            data: {
                lessonsPerDay,
                scoreDistribution,
                activityByWeek
            },
            params: { days: Number(days) }
        });
    } catch (error) {
        console.error('[API] Error getting lesson analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
