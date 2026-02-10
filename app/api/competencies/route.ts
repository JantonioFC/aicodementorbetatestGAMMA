import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerAuth } from '@/lib/auth/serverAuth';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const stats = searchParams.get('stats');

        if (stats === 'true') {
            const count = db.get<{ count: number }>('SELECT COUNT(*) as count FROM competency_log WHERE user_id = ?', [userId])?.count || 0;
            return NextResponse.json({ success: true, stats: { total: count } });
        }

        const comps = category
            ? db.find('competency_log', { user_id: userId, competency_category: category })
            : db.find('competency_log', { user_id: userId });

        return NextResponse.json({ success: true, competencies: comps });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await getServerAuth();
        const body = await req.json();
        const { competency_name, level_achieved, evidence_description, competency_category } = body;

        if (!competency_name || !evidence_description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = `comp_${Date.now()}`;
        db.insert('competency_log', {
            id,
            user_id: userId,
            competency_name,
            competency_category: competency_category || 'General',
            level_achieved: level_achieved || 1,
            evidence_description,
            achieved_date: new Date().toISOString()
        });

        return NextResponse.json({ success: true, competency_id: id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
