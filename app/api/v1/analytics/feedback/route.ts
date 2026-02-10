import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';

export async function GET() {
    try {
        const { user } = await getServerAuth();
        // Assuming admin check or local development access

        const generalStats = db.get(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avgRating,
        SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpfulCount,
        (CAST(SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) * 100 as helpfulPercentage
      FROM lesson_feedback
    `) as any;

        const difficultyDistribution = db.query(`
      SELECT difficulty, COUNT(*) as count
      FROM lesson_feedback
      WHERE difficulty IS NOT NULL
      GROUP BY difficulty
    `) as any[];

        const recentComments = db.query(`
      SELECT f.comment, f.rating, f.created_at, u.email as user_email
      FROM lesson_feedback f
      JOIN user_profiles u ON f.user_id = u.id
      WHERE f.comment IS NOT NULL AND f.comment != ''
      ORDER BY f.created_at DESC
      LIMIT 10
    `) as any[];

        const ratingTrend = db.query(`
      SELECT DATE(created_at) as date, AVG(rating) as avgRating, COUNT(*) as count
      FROM lesson_feedback
      WHERE created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `) as any[];

        return NextResponse.json({
            success: true,
            data: {
                summary: generalStats,
                difficulty: difficultyDistribution,
                recentComments: recentComments,
                trend: ratingTrend
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
