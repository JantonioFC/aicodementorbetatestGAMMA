import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import exportService from '@/lib/services/exportService';
import { getReviewDetails } from '@/lib/services/irp/reviewService';

export async function GET(req: NextRequest) {
    try {
        const { userId, user } = await getServerAuth();
        const { searchParams } = new URL(req.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
        }

        const review = await getReviewDetails(reviewId);

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Since we handle owner check in service or here
        // In local-first, we usually allow the demo user

        const markdown = exportService.convertToMarkdown(review);

        return new Response(markdown, {
            headers: {
                'Content-Type': 'text/markdown',
                'Content-Disposition': `attachment; filename="AI-Code-Mentor-Review-${reviewId}.md"`
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
