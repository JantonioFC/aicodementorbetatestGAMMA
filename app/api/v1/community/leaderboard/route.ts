import { NextRequest, NextResponse } from 'next/server';
import { leaderboardService } from '@/lib/services/community/LeaderboardService';
import logger from '@/lib/logger';

/**
 * GET /api/v1/community/leaderboard
 * Retorna el ranking global de estudiantes basado en puntos de comunidad.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const refresh = searchParams.get('refresh') === 'true';

        if (refresh) {
            await leaderboardService.recalculateMetrics();
        }

        const ranking = await leaderboardService.getTopStudents(limit);

        return NextResponse.json({
            success: true,
            data: ranking
        });

    } catch (error: any) {
        logger.error('[CommunityAPI] Error recuperando leaderboard:', error);
        return NextResponse.json({
            error: 'Error recuperando leaderboard',
            details: error.message
        }, { status: 500 });
    }
}
