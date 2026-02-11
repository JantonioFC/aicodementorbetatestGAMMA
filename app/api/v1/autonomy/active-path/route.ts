import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { learningPathGenerator } from '@/lib/services/autonomy/LearningPathGenerator';
import logger from '@/lib/logger';

/**
 * GET /api/v1/autonomy/active-path
 * Recupera la ruta de aprendizaje activa del usuario.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const activePath = await learningPathGenerator.getActivePath(userId);

        return NextResponse.json({
            success: true,
            data: activePath
        });

    } catch (error: any) {
        logger.error('[AutonomyAPI] Error recuperando ruta activa:', error);
        return NextResponse.json({
            error: 'Error recuperando ruta activa',
            details: error.message
        }, { status: 500 });
    }
}
