import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface ModuleRow {
    id: string;
    title: string;
    description?: string;
    [key: string]: unknown;
}

interface LessonRow {
    id: string;
    module_id: string;
    title: string;
    completed: number;
    [key: string]: unknown;
}

interface ExerciseRow {
    id: string;
    lesson_id: string;
    title: string;
    completed: number;
    [key: string]: unknown;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const { moduleId } = await params;
        const moduleData = db.findOne<ModuleRow>('modules', { id: moduleId });

        if (!moduleData) {
            return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
        }

        const lessons = db.find<LessonRow>('lessons', { module_id: moduleId });
        const lessonsWithExercises = lessons.map(lesson => {
            const exercises = db.find<ExerciseRow>('exercises', { lesson_id: lesson.id });
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
