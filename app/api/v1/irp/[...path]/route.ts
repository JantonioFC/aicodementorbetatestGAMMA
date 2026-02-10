import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import {
    createReviewRequest,
    getReviewHistory,
    getReviewDetails,
    calculateUserMetrics,
    generateSystemStats,
    saveAIReview
} from '@/lib/services/irp/reviewService';
import { isAIAvailable, performAIReview } from '@/lib/services/irp/aiReviewerService';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const { userId, user } = await getServerAuth();
        const path = '/' + (pathSegments?.join('/') || '');

        if (path === '/health') {
            return NextResponse.json({ status: 'healthy', aiAvailable: isAIAvailable() });
        }

        if (path === '/reviews/history') {
            const { searchParams } = new URL(req.url);
            const role = searchParams.get('role') || 'both';
            const status = searchParams.get('status') || 'all';
            const limit = parseInt(searchParams.get('limit') || '20');
            const offset = parseInt(searchParams.get('offset') || '0');

            const history = await getReviewHistory(userId, { role, status, limit, offset });
            return NextResponse.json({ reviews: history, total: history.length });
        }

        if (path.startsWith('/reviews/metrics/')) {
            const targetUserId = path.split('/')[3];
            const metrics = await calculateUserMetrics(targetUserId);
            return NextResponse.json(metrics);
        }

        if (path.startsWith('/reviews/')) {
            const reviewId = path.split('/')[2];
            const details = await getReviewDetails(reviewId);
            return NextResponse.json(details);
        }

        if (path === '/admin/stats') {
            const stats = await generateSystemStats();
            return NextResponse.json(stats);
        }

        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const { userId } = await getServerAuth();
        const path = '/' + (pathSegments?.join('/') || '');

        if (path === '/reviews/request') {
            const body = await req.json();
            const request = await createReviewRequest(body, userId);

            if (isAIAvailable()) {
                processAIReview(request, userId).catch(err => console.error(err));
            }

            return NextResponse.json({
                review_request_id: request.id,
                status: request.status.toLowerCase(),
                created_at: request.created_at,
                message: 'Solicitud creada exitosamente.'
            }, { status: 201 });
        }

        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processAIReview(reviewRequest: any, userId: string) {
    try {
        const result = await performAIReview(reviewRequest);
        if (result.success) {
            await saveAIReview(reviewRequest.id, result.reviewData, userId);
        }
    } catch (error: any) {
        console.error('[IRP] AI review error:', error.message);
    }
}
