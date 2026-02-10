import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { badgeService } from '@/lib/services/gamification/BadgeService';
import logger from '@/lib/logger';

/**
 * POST /api/v1/achievements/check
 * Evalúa las competencias del usuario y otorga nuevos logros si corresponde.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();

        logger.info(`[AchievementsAPI] Iniciando chequeo de logros para ${userId}`);

        const { newBadges } = await badgeService.checkAndAwardBadges(userId);

        return NextResponse.json({
            success: true,
            summary: {
                hasNewAchievements: newBadges.length > 0,
                newBadges
            }
        });

    } catch (error: any) {
        logger.error('[AchievementsAPI] Error verificando logros:', error);
        return NextResponse.json({
            error: 'Error verificando logros',
            details: error.message
        }, { status: 500 });
    }
}
