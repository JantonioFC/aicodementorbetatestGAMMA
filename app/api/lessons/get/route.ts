import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { userId, isAuthenticated } = await getServerAuth();
        if (!isAuthenticated) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const semanaId = searchParams.get('semanaId');
        const dia = searchParams.get('dia');
        const diaIndex = searchParams.get('diaIndex');
        const pomodoroIndex = searchParams.get('pomodoroIndex');

        const diaNum = parseInt(dia || (diaIndex ? (parseInt(diaIndex) + 1).toString() : ''));
        const semanaNum = parseInt(semanaId || '');
        const pomodoroNum = parseInt(pomodoroIndex || '');

        if (isNaN(semanaNum) || isNaN(diaNum) || isNaN(pomodoroNum)) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const diaIndexForDB = diaNum - 1;
        const savedContent: Record<string, unknown>[] = db.query(
            'SELECT * FROM generated_content WHERE user_id = ? AND semana_id = ? AND dia_index = ? AND pomodoro_index = ? ORDER BY created_at DESC LIMIT 1',
            [userId, semanaId, diaIndexForDB, pomodoroIndex]
        );

        if (!savedContent || savedContent.length === 0) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const contentRecord = savedContent[0];
        let lessonContent = contentRecord.content;
        if (typeof lessonContent === 'string') {
            try { lessonContent = JSON.parse(lessonContent); } catch { }
        }

        const lessonObj = (typeof lessonContent === 'object' && lessonContent !== null) ? lessonContent : {};
        return NextResponse.json({
            ...lessonObj as Record<string, unknown>,
            contentId: contentRecord.id,
            retrievedAt: new Date().toISOString(),
            location: { semanaId, dia: diaNum, pomodoroIndex }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
