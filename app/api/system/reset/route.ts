import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { resetType, config } = await req.json();

        db.transaction(() => {
            switch (resetType) {
                case 'soft':
                    if (config.resetCompetencies) db.run('DELETE FROM competency_log');
                    break;
                case 'hard':
                    db.run('DELETE FROM competency_log');
                    db.run('DELETE FROM modules');
                    db.run('DELETE FROM lessons');
                    db.run('DELETE FROM exercises');
                    break;
            }
        })();

        return NextResponse.json({ success: true, message: `System reset executed: ${resetType}` });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
