import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { learningPathGenerator } from '@/lib/services/autonomy/LearningPathGenerator';
import { logger } from '@/lib/observability/Logger';

/**
 * GET /api/v1/autonomy/active-path
 * Recupera la ruta de aprendizaje activa del usuario.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activePath = await learningPathGenerator.getActivePath(userId);

        return NextResponse.json({
            success: true,
            data: activePath
        });

    } catch (error: unknown) {
        logger.error('[AutonomyAPI] Error recuperando ruta activa:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error recuperando ruta activa',
            details: message
        }, { status: 500 });
    }
}
