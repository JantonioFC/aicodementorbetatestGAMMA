import { NextRequest, NextResponse } from 'next/server';
import { peerReviewService } from '@/lib/services/community/PeerReviewService';
import logger from '@/lib/logger';

/**
 * GET /api/v1/community/feed
 * Retorna el feed público de lecciones compartidas por la comunidad.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const feed = await peerReviewService.getPublicFeed(limit);

        return NextResponse.json({
            success: true,
            data: feed
        });

    } catch (error: any) {
        logger.error('[CommunityAPI] Error recuperando feed:', error);
        return NextResponse.json({
            error: 'Error recuperando feed',
            details: error.message
        }, { status: 500 });
    }
}
