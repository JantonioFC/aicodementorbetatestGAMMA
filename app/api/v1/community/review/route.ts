import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { peerReviewService } from '@/lib/services/community/PeerReviewService';
import { logger } from '@/lib/observability/Logger';

/**
 * POST /api/v1/community/review
 * Agrega una valoración y comentario a una lección compartida.
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sharedLessonId, rating, comment } = await req.json();

        if (!sharedLessonId || !rating) {
            return NextResponse.json({ error: 'Faltan parámetros: sharedLessonId y rating son obligatorios' }, { status: 400 });
        }

        const result = await peerReviewService.addReview(userId, sharedLessonId, rating, comment);

        return NextResponse.json({
            success: true,
            id: result.id
        });

    } catch (error: unknown) {
        logger.error('[CommunityAPI] Error agregando revisión:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error agregando revisión',
            details: message
        }, { status: 500 });
    }
}
