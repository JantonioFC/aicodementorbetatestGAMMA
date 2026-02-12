import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const body = await req.json();
        const { lessonId, sessionId, rating, wasHelpful, difficulty, comment } = body;

        if (!lessonId || !rating) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const feedbackId = uuidv4();
        db.run(
            `INSERT INTO lesson_feedback (id, user_id, lesson_id, session_id, rating, was_helpful, difficulty, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [feedbackId, userId, lessonId, sessionId || null, rating, wasHelpful ? 1 : 0, difficulty || null, comment || null]
        );

        const stats = db.get(
            `SELECT 
          AVG(rating) as avgRating, 
          COUNT(*) as totalReviews,
          SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpfulCount
       FROM lesson_feedback WHERE lesson_id = ?`,
            [lessonId]
        ) as { avgRating: number | null; totalReviews: number; helpfulCount: number } | undefined;

        return NextResponse.json({
            success: true,
            feedbackId,
            lessonStats: {
                averageRating: parseFloat(stats?.avgRating?.toFixed(2) ?? '') || rating,
                totalReviews: stats?.totalReviews || 1,
                helpfulPercentage: stats?.totalReviews
                    ? Math.round((stats.helpfulCount / stats.totalReviews) * 100)
                    : (wasHelpful ? 100 : 0)
            }
        }, { status: 201 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
