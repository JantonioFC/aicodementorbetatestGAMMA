import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { masteryAnalyticsService } from '@/lib/services/MasteryAnalyticsService';
import logger from '@/lib/logger';

/**
 * GET /api/v1/analytics/mastery
 * Retorna el reporte de maestría del usuario autenticado.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();

        logger.info(`[AnalyticsAPI] Solicitando reporte de maestría para ${userId}`);

        const report = await masteryAnalyticsService.getUserMastery(userId);
        const recommendations = await masteryAnalyticsService.getRecommendations(userId);

        return NextResponse.json({
            success: true,
            data: {
                ...report,
                recommendations
            }
        });

    } catch (error: any) {
        logger.error('[AnalyticsAPI] Error recuperando analíticas de maestría:', error);
        return NextResponse.json({
            error: 'Error recuperando analíticas',
            details: error.message
        }, { status: 500 });
    }
}
