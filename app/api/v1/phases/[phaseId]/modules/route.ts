import { NextRequest, NextResponse } from 'next/server';
import { getRawDb } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ phaseId: string }> }
) {
    try {
        const { phaseId } = await params;
        const phaseNumber = parseInt(phaseId, 10);

        if (isNaN(phaseNumber) || phaseNumber < 0) {
            return NextResponse.json({ error: 'Bad Request', message: 'Invalid phaseId' }, { status: 400 });
        }

        const db = getRawDb();
        const phaseExists = db.prepare('SELECT COUNT(*) as count FROM fases WHERE fase = ?').get(phaseNumber) as { count: number } | undefined;

        if (!phaseExists || phaseExists.count === 0) {
            return NextResponse.json({ error: 'Not Found', message: `Phase ${phaseNumber} not found` }, { status: 404 });
        }

        const modulesQuery = `
      SELECT 
        m.modulo,
        m.titulo_modulo,
        s.semana,
        s.titulo_semana,
        s.tematica
      FROM modulos m
      JOIN semanas s ON m.id = s.modulo_id
      JOIN fases f ON m.fase_id = f.id
      WHERE f.fase = ?
      ORDER BY m.modulo, s.semana
    `;

        const rawData = db.prepare(modulesQuery).all(phaseNumber) as { modulo: number; titulo_modulo: string; semana: number; titulo_semana: string; tematica: string | null }[];

        if (!rawData || rawData.length === 0) {
            return NextResponse.json({ error: 'Not Found', message: 'No modules found for this phase' }, { status: 404 });
        }

        const modulesMap = new Map();
        rawData.forEach(row => {
            const moduloKey = row.modulo;
            if (!modulesMap.has(moduloKey)) {
                modulesMap.set(moduloKey, {
                    modulo: row.modulo,
                    tituloModulo: row.titulo_modulo,
                    weeks: []
                });
            }
            modulesMap.get(moduloKey).weeks.push({
                semana: row.semana,
                tituloSemana: row.titulo_semana,
                tematica: row.tematica || 'Sin tema definido'
            });
        });

        return NextResponse.json({
            phaseId: phaseNumber,
            totalModules: modulesMap.size,
            totalWeeks: rawData.length,
            modulos: Array.from(modulesMap.values()),
            metadata: {
                apiVersion: '1.0',
                dataSource: 'sqlite',
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
    }
}
