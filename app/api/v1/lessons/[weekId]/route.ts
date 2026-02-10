import { NextRequest, NextResponse } from 'next/server';
import { getWeekData, validateDatabase } from '@/lib/curriculum-sqlite';
import { fetchRawHTML } from '@/lib/arm/retriever';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ weekId: string }> }
) {
    try {
        const { weekId } = await params;
        const weekNumber = parseInt(weekId, 10);

        if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 100) {
            return NextResponse.json({ error: 'Bad Request', message: 'weekId must be between 1 and 100' }, { status: 400 });
        }

        const dbValidation = await validateDatabase();
        if (!dbValidation.isValid) {
            return NextResponse.json({ error: 'Database Integrity Error' }, { status: 500 });
        }

        const weekData = await getWeekData(weekNumber);
        if (!weekData) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        let armSources: any[] = [];
        if (weekData.official_sources && weekData.official_sources.length > 0) {
            armSources = await processARMSources(weekData.official_sources);
        }

        return NextResponse.json({
            week: weekData.semana,
            title: weekData.titulo,
            phaseFile: `fase-${weekData.fase}.json`,
            lessonContent: {
                summary: weekData.tematica || '',
                objectives: weekData.objetivos || [],
                topics: extractTopics(weekData),
                activities: weekData.actividades || [],
                deliverables: weekData.entregables || 'Sin entregables',
                resources: weekData.recursos || [],
                exercises: weekData.ejercicios || [],
                dailySchema: weekData.esquemaDiario || []
            },
            armSources,
            phase: {
                phase: weekData.fase,
                title: weekData.tituloFase,
                duration: weekData.duracionMeses,
                purpose: weekData.proposito
            },
            module: {
                module: weekData.modulo,
                title: weekData.tituloModulo
            },
            metadata: {
                apiVersion: '1.0',
                dataSource: 'sqlite',
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

async function processARMSources(sources: string[]) {
    const results: any[] = [];
    for (const url of sources.slice(0, 3)) {
        try {
            const html = await fetchRawHTML(url);
            results.push({
                url,
                content: html.replace(/<[^>]+>/g, ' ').substring(0, 2000),
                status: 'success'
            });
        } catch (e: any) {
            results.push({ url, status: 'error', error: e.message });
        }
    }
    return results;
}

function extractTopics(data: any) {
    const topics = (data.objetivos || []).slice(0, 3);
    if (data.tematica && !topics.includes(data.tematica)) topics.push(data.tematica);
    return topics.slice(0, 5);
}
