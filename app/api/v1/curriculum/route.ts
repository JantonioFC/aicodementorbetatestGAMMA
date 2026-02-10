import { NextResponse } from 'next/server';
import { getCurriculumIndex, validateDatabase } from '@/lib/curriculum-sqlite';

export async function GET() {
    try {
        const dbValidation = await validateDatabase();
        if (!dbValidation.isValid) {
            return NextResponse.json({ error: 'Database Integrity Error' }, { status: 500 });
        }

        const curriculumIndex = await getCurriculumIndex();
        if (!curriculumIndex) {
            return NextResponse.json({ error: 'Not Found' }, { status: 500 });
        }

        return NextResponse.json({
            version: curriculumIndex.version || '9.0.0-sqlite',
            totalPhases: curriculumIndex.totalPhases,
            totalWeeks: curriculumIndex.totalWeeks,
            phaseMapping: curriculumIndex.phaseMapping.map((phase: any) => ({
                fase: phase.fase,
                fileName: `fase-${phase.fase}.json`,
                startWeek: phase.startWeek,
                endWeek: phase.endWeek,
                title: phase.titulo,
                weekCount: phase.weekCount
            })),
            phases: curriculumIndex.fases,
            metadata: {
                apiVersion: '1.0',
                dataSource: 'sqlite',
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
