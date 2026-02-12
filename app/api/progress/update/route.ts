import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { type, id, completed, userSolution } = await req.json();

        if (!type || !id) {
            return NextResponse.json({ error: 'type e id son requeridos' }, { status: 400 });
        }

        let moduleId;
        const now = new Date().toISOString();

        switch (type) {
            case 'lesson':
                if (completed === false) {
                    db.run('UPDATE lessons SET completed = 0, completed_date = NULL WHERE id = ?', [id]);
                } else {
                    db.run('UPDATE lessons SET completed = 1, completed_date = ? WHERE id = ?', [now, id]);
                }
                const lesson = db.findOne('lessons', { id }) as { module_id?: string } | undefined;
                moduleId = lesson?.module_id;
                break;

            case 'exercise':
                if (completed === false) {
                    db.run('UPDATE exercises SET completed = 0, completed_date = NULL, user_solution = NULL WHERE id = ?', [id]);
                } else {
                    db.run('UPDATE exercises SET completed = 1, completed_date = ?, user_solution = ? WHERE id = ?', [now, userSolution || null, id]);
                }
                const exercise = db.query('SELECT e.*, l.module_id FROM exercises e JOIN lessons l ON e.lesson_id = l.id WHERE e.id = ?', [id])[0] as { module_id?: string } | undefined;
                moduleId = exercise?.module_id;
                break;

            case 'reset':
                moduleId = id;
                break;
        }

        return NextResponse.json({ success: true, message: 'Progreso actualizado' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
