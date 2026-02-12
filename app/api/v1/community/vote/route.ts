import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { sharedLessonService } from '@/lib/services/community/SharedLessonService';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/community/vote
 * Registra un voto (up/down) para una lección compartida.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sharedId, value } = await req.json();

        if (!sharedId || value === undefined) {
            return NextResponse.json({ error: 'Faltan parámetros: sharedId y value son obligatorios' }, { status: 400 });
        }

        await sharedLessonService.voteLesson(userId, sharedId, value);

        return NextResponse.json({
            success: true
        });

    } catch (error: unknown) {
        logger.error('[CommunityAPI] Error votando lección:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error registrando voto',
            details: message
        }, { status: 500 });
    }
}
