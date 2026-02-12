import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { learningPathGenerator } from '@/lib/services/autonomy/LearningPathGenerator';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/autonomy/generate-path
 * Dispara el motor de IA para crear una ruta personalizada.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetProfile } = await req.json();

        const pathId = await learningPathGenerator.generatePath(userId, targetProfile || 'frontend-starter');

        return NextResponse.json({
            success: true,
            id: pathId
        });

    } catch (error: unknown) {
        logger.error('[AutonomyAPI] Error generando ruta:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error generando ruta de aprendizaje',
            details: message
        }, { status: 500 });
    }
}
