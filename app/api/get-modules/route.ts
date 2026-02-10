import { NextResponse } from 'next/server';
import { getCurriculumSummary } from '@/lib/curriculum-sqlite';

export async function GET() {
    try {
        const summary = getCurriculumSummary();
        const formattedModules = summary.curriculum.flatMap(fase =>
            fase.modulos.map(modulo => {
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
        ).sort((a: any, b: any) => a.id - b.id);

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
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
