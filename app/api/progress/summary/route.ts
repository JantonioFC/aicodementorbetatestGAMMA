import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/serverAuth';
import db from '@/lib/db';

export async function GET() {
    try {
        const { userId } = await getServerAuth();

        const lessonProgress = db.query(`
      SELECT lesson_id, completed, completed_at, progress_percentage, time_spent_seconds
      FROM user_lesson_progress
      WHERE user_id = ?
    `, [userId]) as { lesson_id: string; completed: number; completed_at: string | null; progress_percentage: number; time_spent_seconds: number }[];

        const exerciseProgress = db.query(`
      SELECT exercise_id, lesson_id, completed, completed_at, attempts_count, best_score, time_spent_seconds
      FROM user_exercise_progress
      WHERE user_id = ?
    `, [userId]) as { exercise_id: string; lesson_id: string; completed: number; completed_at: string | null; attempts_count: number; best_score: number; time_spent_seconds: number }[];

        const completedLessons = lessonProgress.filter(l => l.completed === 1);
        const completedExercises = exerciseProgress.filter(e => e.completed === 1);
        const all = [...completedLessons, ...completedExercises];

        const stats = {
            totalLessonsCompleted: completedLessons.length,
            totalExercisesCompleted: completedExercises.length,
            totalTimeSpent: all.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0)
        };

        return NextResponse.json({
            success: true,
            summary: {
                totalSemanasCompletadas: Math.floor(completedLessons.length / 5),
                totalSemanasIniciadas: Math.ceil(lessonProgress.length / 5),
                porcentajeTotalCompletado: Math.round((completedLessons.length / 40) * 100)
            },
            stats,
            lastUpdated: new Date().toISOString()
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
