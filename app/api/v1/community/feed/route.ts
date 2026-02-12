import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import { sharedLessonService } from '@/lib/services/community/SharedLessonService';
import { logger } from '@/lib/observability/Logger';

/**
 * GET /api/v1/community/feed
 * Retorna el feed público de lecciones compartidas por la comunidad.
 */
export async function GET(req: NextRequest) {
    try {
        const { userId: rawUserId } = await getServerAuth().catch(() => ({ userId: undefined }));
        const userId = rawUserId ?? undefined;
        const { searchParams } = new URL(req.url);

        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category') || undefined;
        const sort = (searchParams.get('sort') as 'latest' | 'top') || 'latest';

        const feed = await sharedLessonService.getPublicLessons(userId, {
            category,
            sort,
            limit
        });

        return NextResponse.json({
            success: true,
            data: feed
        });

    } catch (error: unknown) {
        logger.error('[CommunityAPI] Error recuperando feed:', error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
            error: 'Error recuperando feed',
            details: message
        }, { status: 500 });
    }
}
