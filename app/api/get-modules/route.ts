import { NextResponse } from 'next/server';
import { getCurriculumSummary } from '@/lib/curriculum-sqlite';
import { CurriculumSummaryPhase, CurriculumSummaryModule } from '@/lib/repositories/CurriculumRepository';

export async function GET() {
    try {
        const summary = getCurriculumSummary();
        const formattedModules = summary.curriculum.flatMap((fase: CurriculumSummaryPhase) =>
            fase.modulos.map((modulo: CurriculumSummaryModule) => {
                const lessonProgress = 0; // Placeholder
                const exerciseProgress = 0; // Placeholder

                return {
                    id: modulo.modulo,
                    title: modulo.titulo_modulo,
                    filename: `modulo-${modulo.modulo}`,
                    status: 'active',
                    uploadDate: new Date().toISOString(),
                    lessons: {
                        total: modulo.semanas.length,
                        completed: 0,
                        progress: lessonProgress
                    },
                    exercises: {
                        total: 0,
                        completed: 0,
                        progress: exerciseProgress
                    },
                    overallProgress: Math.round((lessonProgress + exerciseProgress) / 2)
                };
            })
        ).sort((a, b) => Number(a.id) - Number(b.id));

        return NextResponse.json({
            success: true,
            modules: formattedModules,
            stats: {
                totalModules: summary.totalModules,
                totalLessons: summary.totalWeeks,
                completedLessons: 0,
                totalExercises: 0,
                completedExercises: 0,
                overallProgress: 0
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
    }
}
