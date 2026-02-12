import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { masteryAnalyticsService } from '@/lib/services/MasteryAnalyticsService';
import { logger } from '@/lib/observability/Logger';

/**
 * GET /api/v1/analytics/mastery
 * Retorna el reporte de maestría del usuario autenticado.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('[AnalyticsAPI] Error recuperando analíticas de maestría:', error);
        return NextResponse.json({
            error: 'Error recuperando analíticas',
            details: message
        }, { status: 500 });
    }
}
