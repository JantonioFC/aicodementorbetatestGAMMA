import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const { moduleId } = await params;
        const moduleData: any = db.findOne('modules', { id: moduleId });

        if (!moduleData) {
            return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
        }

        const lessons: any[] = db.find('lessons', { module_id: moduleId });
        const lessonsWithExercises = lessons.map(lesson => {
            const exercises: any[] = db.find('exercises', { lesson_id: lesson.id });
            return {
                ...lesson,
                completed: lesson.completed === 1,
                exercises: exercises.map(ex => ({ ...ex, completed: ex.completed === 1 }))
            };
        });

        return NextResponse.json({
            success: true,
            module: moduleData,
            lessons: lessonsWithExercises
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
