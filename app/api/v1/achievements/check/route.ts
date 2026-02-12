import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { badgeService } from '@/lib/services/gamification/BadgeService';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/achievements/check
 * Evalúa las competencias del usuario y otorga nuevos logros si corresponde.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        logger.info(`[AchievementsAPI] Iniciando chequeo de logros para ${userId}`);

        const { newBadges } = await badgeService.checkAndAwardBadges(userId);

        return NextResponse.json({
            success: true,
            summary: {
                hasNewAchievements: newBadges.length > 0,
                newBadges
            }
        });

    } catch (error: unknown) {
        logger.error('[AchievementsAPI] Error verificando logros:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error verificando logros',
            details: message
        }, { status: 500 });
    }
}
