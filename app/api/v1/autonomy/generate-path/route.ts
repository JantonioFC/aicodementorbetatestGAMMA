import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { learningPathGenerator } from '@/lib/services/autonomy/LearningPathGenerator';
import logger from '@/lib/logger';

/**
 * POST /api/v1/autonomy/generate-path
 * Dispara el motor de IA para crear una ruta personalizada.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { targetProfile } = await req.json();

        const pathId = await learningPathGenerator.generatePath(userId, targetProfile || 'frontend-starter');

        return NextResponse.json({
            success: true,
            id: pathId
        });

    } catch (error: any) {
        logger.error('[AutonomyAPI] Error generando ruta:', error);
        return NextResponse.json({
            error: 'Error generando ruta de aprendizaje',
            details: error.message
        }, { status: 500 });
    }
}
