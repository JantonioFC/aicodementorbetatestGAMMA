import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const stats = searchParams.get('stats');

        if (stats === 'true') {
            const total = (db.get('SELECT COUNT(*) as count FROM competency_log') as any).count;
            return NextResponse.json({ success: true, stats: { total } });
        }

        const comps = category
            ? db.query('SELECT * FROM competency_log WHERE competency_category = ?', [category])
            : db.query('SELECT * FROM competency_log');

        return NextResponse.json({ success: true, competencies: comps });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { competency_name, level_achieved, evidence_description } = body;

        if (!competency_name || !evidence_description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = `comp_${Date.now()}`;
        db.insert('competency_log', {
            id,
            competency_name,
            competency_category: body.competency_category || 'General',
            level_achieved: level_achieved || 1,
            evidence_description,
            achieved_date: new Date().toISOString()
        });

        return NextResponse.json({ success: true, competency_id: id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
