import { NextResponse } from 'next/server';
import { getPhasesOnly, validateDatabase } from '@/lib/curriculum-sqlite';

export async function GET() {
    try {
        const dbValidation = await validateDatabase();
        if (!dbValidation.isValid) {
            return NextResponse.json({ error: 'Database Integrity Error' }, { status: 500 });
        }

        const curriculumSummary = await getPhasesOnly();
        if (!curriculumSummary) {
            return NextResponse.json({ error: 'Not Found' }, { status: 500 });
        }

        return NextResponse.json({
            version: curriculumSummary.version,
            totalPhases: curriculumSummary.totalPhases,
            totalModules: curriculumSummary.totalModules,
            totalWeeks: curriculumSummary.totalWeeks,
            curriculum: curriculumSummary.curriculum.map((fase: any) => ({
                fase: fase.fase,
                tituloFase: fase.tituloFase,
                duracionMeses: fase.duracionMeses,
                proposito: fase.proposito,
                modulos: []
            })),
            metadata: {
                apiVersion: '2.0',
                dataSource: 'sqlite',
                generatedAt: new Date().toISOString(),
                lazyLoading: {
                    enabled: true,
                    modulesEndpoint: '/api/v1/phases/{phaseId}/modules',
                    weeksEndpoint: '/api/v1/weeks/{weekId}/details'
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
