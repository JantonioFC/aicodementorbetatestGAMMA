import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { badgeService } from '@/lib/services/gamification/BadgeService';
import { logger } from '@/lib/observability/Logger';

/**
 * GET /api/v1/achievements
 * Retorna la lista de logros desbloqueados por el usuario.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const achievements = await badgeService.getUserAchievements(userId);

        // Metadata simple para el widget
        const metadata = {
            completionPercentage: Math.min(100, Math.round((achievements.length / 10) * 100)), // Asumiendo 10 logros totales por ahora
            totalAchievementsAvailable: 10
        };

        return NextResponse.json({
            success: true,
            achievements,
            metadata
        });

    } catch (error: unknown) {
        logger.error('[AchievementsAPI] Error recuperando logros:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error recuperando logros',
            details: message
        }, { status: 500 });
    }
}
