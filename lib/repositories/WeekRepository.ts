import { db } from '../db';

/**
 * Repository for accessing Week-related data
 * Replaces monolithic curriculum-sqlite.js function
 */

export interface WeekData {
    semana: number;
    numero: number;
    titulo: string;
    tituloSemana: string;
    objetivos: string[];
    tematica: string;
    actividades: string[];
    entregables: string;
    recursos: any[];
    official_sources: any[];
    ejercicios: any[];
    modulo: number;
    tituloModulo: string;
    fase: number;
    tituloFase: string;
    duracionMeses: string;
    proposito: string;
    esquemaDiario: Array<{
        dia: number;
        concepto: string;
        pomodoros: string[];
    }>;
    sourceType: string;
    dataSource: string;
    queryTime: string;
}

export interface WeekDetails {
    semana: number;
    titulo_semana: string;
    tematica: string;
    objetivos: string;
    actividades: string;
    entregables: string;
    recursos: string;
    official_sources: string;
    ejercicios: string;
    guia_estudio: string;
    esquema_diario: Array<{
        dia: number;
        concepto: string;
        pomodoros: string[];
    }>;
    modulo_numero: number;
    modulo_titulo: string;
    fase_numero: number;
    fase_titulo: string;
}

export class WeekRepository {

    /**
     * Get basic week data
     */
    getWeekData(weekId: number): WeekData | null {
        if (!weekId || weekId < 1) return null;

        const query = `
            SELECT 
                s.*,
                m.modulo, m.titulo_modulo,
                f.fase, f.titulo_fase, f.duracion_meses, f.proposito
            FROM semanas s
            JOIN modulos m ON s.modulo_id = m.id  
            JOIN fases f ON m.fase_id = f.id
            WHERE s.semana = ?
        `;

        const weekData = db.get<any>(query, [weekId]);
        if (!weekData) return null;

        const esquemaDiario = db.query<any>(`
            SELECT dia, concepto, pomodoros
            FROM esquema_diario 
            WHERE semana_id = ?
            ORDER BY dia
        `, [weekData.id]);

        return this._mapWeekData(weekData, esquemaDiario);
    }

    /**
     * Get detailed week data (lazy loading optimized)
     */
    getWeekDetails(weekId: number): WeekDetails | null {
        if (!weekId || weekId < 1) return null;

        const query = `
            SELECT 
                s.semana, s.titulo_semana, s.objetivos, s.tematica,
                s.actividades, s.entregables, s.recursos, s.official_sources,
                s.ejercicios, s.guia_estudio,
                m.modulo as modulo_numero, m.titulo_modulo,
                f.fase as fase_numero, f.titulo_fase
            FROM semanas s
            JOIN modulos m ON s.modulo_id = m.id  
            JOIN fases f ON m.fase_id = f.id
            WHERE s.semana = ?
        `;

        const weekData = db.get<any>(query, [weekId]);
        if (!weekData) return null;

        const weekInternalId = db.get<{ id: string }>('SELECT id FROM semanas WHERE semana = ?', [weekId])?.id;

        const esquemaDiarioRaw = db.query<any>(`
            SELECT dia, concepto, pomodoros
            FROM esquema_diario 
            WHERE semana_id = ?
            ORDER BY dia
        `, [weekInternalId]);

        return this._mapWeekDetails(weekData, esquemaDiarioRaw);
    }

    private _mapWeekData(weekData: any, esquemaDiario: any[]): WeekData {
        return {
            semana: weekData.semana,
            numero: weekData.semana,
            titulo: weekData.titulo_semana,
            tituloSemana: weekData.titulo_semana,
            objetivos: this._parseJSON(weekData.objetivos),
            tematica: weekData.tematica,
            actividades: this._parseJSON(weekData.actividades),
            entregables: weekData.entregables,
            recursos: this._parseJSON(weekData.recursos),
            official_sources: this._parseJSON(weekData.official_sources),
            ejercicios: this._parseJSON(weekData.ejercicios),
            modulo: weekData.modulo,
            tituloModulo: weekData.titulo_modulo,
            fase: weekData.fase,
            tituloFase: weekData.titulo_fase,
            duracionMeses: weekData.duracion_meses,
            proposito: weekData.proposito,
            esquemaDiario: esquemaDiario.map(d => ({
                dia: d.dia,
                concepto: d.concepto,
                pomodoros: this._parseJSON(d.pomodoros)
            })),
            sourceType: 'sqlite-repo',
            dataSource: 'curriculum.db',
            queryTime: new Date().toISOString()
        };
    }

    private _mapWeekDetails(weekData: any, esquemaDiarioRaw: any[]): WeekDetails {
        return {
            semana: weekData.semana,
            titulo_semana: weekData.titulo_semana,
            tematica: weekData.tematica,
            objetivos: weekData.objetivos,
            actividades: weekData.actividades,
            entregables: weekData.entregables,
            recursos: weekData.recursos,
            official_sources: weekData.official_sources,
            ejercicios: weekData.ejercicios,
            guia_estudio: weekData.guia_estudio,
            esquema_diario: esquemaDiarioRaw.map(d => ({
                dia: d.dia,
                concepto: d.concepto,
                pomodoros: this._parseJSON(d.pomodoros)
            })),
            modulo_numero: weekData.modulo_numero,
            modulo_titulo: weekData.titulo_modulo,
            fase_numero: weekData.fase_numero,
            fase_titulo: weekData.titulo_fase
        };
    }

    private _parseJSON(str: any): any[] {
        try {
            return typeof str === 'string' ? JSON.parse(str) : (str || []);
        } catch (e) {
            return [];
        }
    }
}

export const weekRepository = new WeekRepository();
