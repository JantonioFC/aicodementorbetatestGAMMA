import { NextRequest, NextResponse } from 'next/server';
import { getWeekDetails, validateDatabase } from '@/lib/curriculum-sqlite';

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

        const weekDetails = await getWeekDetails(weekNumber);
        if (!weekDetails) {
            return NextResponse.json({ error: 'Not Found', message: `Week ${weekNumber} not found` }, { status: 404 });
        }

        const detailsResponse: any = {
            semana: weekDetails.semana,
            tituloSemana: weekDetails.titulo_semana,
            tematica: weekDetails.tematica,
            objetivos: weekDetails.objetivos ? JSON.parse(weekDetails.objetivos) : [],
            actividades: weekDetails.actividades ? JSON.parse(weekDetails.actividades) : [],
            entregables: weekDetails.entregables || null,
            recursos: weekDetails.recursos ? JSON.parse(weekDetails.recursos) : [],
            ejercicios: weekDetails.ejercicios ? JSON.parse(weekDetails.ejercicios) : [],
            esquemaDiario: weekDetails.esquema_diario || [],
            officialSources: weekDetails.official_sources ? JSON.parse(weekDetails.official_sources) : [],
            modulo: {
                numero: weekDetails.modulo_numero,
                titulo: weekDetails.modulo_titulo
            },
            fase: {
                numero: weekDetails.fase_numero,
                titulo: weekDetails.fase_titulo
            }
        };

        if (weekDetails.guia_estudio && weekDetails.guia_estudio.trim() !== '') {
            try {
                detailsResponse.guiaEstudio = JSON.parse(weekDetails.guia_estudio);
            } catch (e) {
                console.warn('Error parsing guia_estudio');
            }
        }

        detailsResponse.metadata = {
            apiVersion: '1.0',
            dataSource: 'sqlite',
            generatedAt: new Date().toISOString(),
            guiaEstudioIncluida: !!detailsResponse.guiaEstudio
        };

        return NextResponse.json(detailsResponse);

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
