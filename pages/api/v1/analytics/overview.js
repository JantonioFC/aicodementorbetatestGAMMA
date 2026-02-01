/**
 * API Endpoint: GET /api/v1/analytics/overview
 * Retorna métricas generales del sistema.
 */

import { analyticsService } from '../../../../lib/services/AnalyticsService';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const overview = analyticsService.getOverview();
        const evaluationMetrics = analyticsService.getEvaluationMetrics();

        res.status(200).json({
            success: true,
            data: {
                overview,
                evaluationMetrics
            },
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API] Error getting analytics overview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
