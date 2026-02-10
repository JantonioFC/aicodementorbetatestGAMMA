import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const rows = db.query(
            `SELECT id, title, custom_content, generated_lesson, created_at, updated_at 
       FROM sandbox_generations 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        ) as any[];

        const countResult: any = db.get(`SELECT count(*) as total FROM sandbox_generations WHERE user_id = ?`, [userId]);
        const total = countResult?.total || 0;

        const generations = rows.map(r => ({
            ...r,
            generated_lesson: JSON.parse(r.generated_lesson)
        }));

        return NextResponse.json({
            success: true,
            data: {
                generations,
                count: generations.length,
                total,
                hasMore: total > (offset + limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { customContent, generatedLesson, metadata } = await req.json();

        if (!customContent || !generatedLesson) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const title = customContent.split(/\s+/).slice(0, 7).join(' ').substring(0, 100);
        const id = crypto.randomUUID();

        db.insert('sandbox_generations', {
            id,
            user_id: userId,
            custom_content: customContent,
            title,
            generated_lesson: JSON.stringify(generatedLesson),
            metadata: JSON.stringify(metadata || {}),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id, title, created_at: new Date().toISOString() }
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
