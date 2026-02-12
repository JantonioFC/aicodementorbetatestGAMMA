import { db } from '../db';

/**
 * Repository for accessing Global Curriculum data
 * Replaces monolithic curriculum-sqlite.js functions
 */

export interface PhaseIndex {
    fase: number;
    titulo: string;
    startWeek: number;
    endWeek: number;
    weekCount: number;
}

export interface CurriculumPhase {
    fase: number;
    titulo: string;
    duracion: string;
    proposito: string;
    totalModulos: number;
    totalSemanas: number;
}

export interface CurriculumIndex {
    version: string;
    sourceType: string;
    dataStore: string;
    totalPhases: number;
    totalWeeks: number;
    phaseMapping: PhaseIndex[];
    fases: CurriculumPhase[];
    generatedAt: string;
}

export interface CurriculumSummaryWeek {
    semana: number;
    titulo_semana: string;
    tematica: string;
}

export interface CurriculumSummaryModule {
    modulo: number;
    titulo_modulo: string;
    semanas: CurriculumSummaryWeek[];
}

export interface CurriculumSummaryPhase {
    fase: number;
    titulo_fase: string;
    duracion_meses: string;
    proposito: string;
    modulos: CurriculumSummaryModule[];
}

interface PhaseRow {
    id: number | string;
    fase: number;
    titulo_fase: string;
    duracion_meses: string;
    proposito: string;
    total_modulos?: number;
    total_semanas?: number;
}

interface PhaseMappingRow {
    fase: number;
    titulo_fase: string;
    start_week: number;
    end_week: number;
    week_count: number;
}

interface SummaryRow {
    fase: number;
    titulo_fase: string;
    duracion_meses: string;
    proposito: string;
    modulo: number;
    titulo_modulo: string;
    semana: number;
    titulo_semana: string;
    tematica: string | null;
}

interface TotalCountsRow {
    total_phases?: number;
    total_modules: number;
    total_weeks: number;
}

export class CurriculumRepository {

    /**
     * Get curriculum index structure
     */
    getCurriculumIndex(): CurriculumIndex {
        const fasesData = db.query<PhaseRow>(`
            SELECT f.*, COUNT(m.id) as total_modulos, COUNT(s.id) as total_semanas
            FROM fases f
            LEFT JOIN modulos m ON f.id = m.fase_id
            LEFT JOIN semanas s ON m.id = s.modulo_id
            GROUP BY f.id
            ORDER BY f.fase
        `);

        const phaseMappings = db.query<PhaseMappingRow>(`
            SELECT 
                f.fase, f.titulo_fase,
                MIN(s.semana) as start_week,
                MAX(s.semana) as end_week,
                COUNT(s.semana) as week_count
            FROM fases f
            JOIN modulos m ON f.id = m.fase_id  
            JOIN semanas s ON m.id = s.modulo_id
            GROUP BY f.fase, f.titulo_fase
            ORDER BY f.fase
        `);

        const totalWeeksResult = db.get<{ total: number }>('SELECT COUNT(*) as total FROM semanas');
        const totalWeeks = totalWeeksResult ? totalWeeksResult.total : 0;

        return {
            version: '9.1.0-repo',
            sourceType: 'sqlite-repo',
            dataStore: 'curriculum.db',
            totalPhases: fasesData.length,
            totalWeeks,
            phaseMapping: phaseMappings.map(row => ({
                fase: row.fase,
                titulo: row.titulo_fase,
                startWeek: row.start_week,
                endWeek: row.end_week,
                weekCount: row.week_count
            })),
            fases: fasesData.map(fase => ({
                fase: fase.fase,
                titulo: fase.titulo_fase,
                duracion: fase.duracion_meses,
                proposito: fase.proposito,
                totalModulos: fase.total_modulos || 0,
                totalSemanas: fase.total_semanas || 0
            })),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get basic phases only (Lazy Loading)
     */
    getPhasesOnly() {
        const phases = db.query<PhaseRow>(`
            SELECT fase, titulo_fase, duracion_meses, proposito
            FROM fases
            ORDER BY fase
        `);

        const totals = db.get<{ total_phases: number; total_modules: number; total_weeks: number }>(`
            SELECT 
                COUNT(DISTINCT f.id) as total_phases,
                COUNT(DISTINCT m.id) as total_modules,
                COUNT(DISTINCT s.id) as total_weeks
            FROM fases f
            LEFT JOIN modulos m ON f.id = m.fase_id
            LEFT JOIN semanas s ON m.id = s.modulo_id
        `);

        return {
            version: '9.1.0-repo',
            sourceType: 'sqlite-repo',
            totalPhases: totals?.total_phases || 0,
            totalModules: totals?.total_modules || 0,
            totalWeeks: totals?.total_weeks || 0,
            curriculum: phases.map(phase => ({
                fase: phase.fase,
                tituloFase: phase.titulo_fase,
                duracionMeses: phase.duracion_meses,
                proposito: phase.proposito,
                modulos: [] // Lazy loaded
            })),
            metadata: {
                optimizedFor: 'lazy-loading',
                loadingStrategy: 'phases-only-initial'
            }
        };
    }

    /**
     * Get full summary hierarchy
     */
    getCurriculumSummary() {
        const rawData = db.query<SummaryRow>(`
            SELECT 
                f.fase, f.titulo_fase, f.duracion_meses, f.proposito,
                m.modulo, m.titulo_modulo,
                s.semana, s.titulo_semana, s.tematica
            FROM fases f
            JOIN modulos m ON f.id = m.fase_id
            JOIN semanas s ON m.id = s.modulo_id
            ORDER BY f.fase, m.modulo, s.semana
        `);

        const fasesMap = new Map<number, CurriculumSummaryPhase>();

        rawData.forEach(row => {
            if (!fasesMap.has(row.fase)) {
                fasesMap.set(row.fase, {
                    fase: row.fase,
                    titulo_fase: row.titulo_fase,
                    duracion_meses: row.duracion_meses,
                    proposito: row.proposito,
                    modulos: []
                });
            }
            const fase = fasesMap.get(row.fase)!;

            let modulo = fase.modulos.find(m => m.modulo === row.modulo);
            if (!modulo) {
                modulo = {
                    modulo: row.modulo,
                    titulo_modulo: row.titulo_modulo,
                    semanas: []
                };
                fase.modulos.push(modulo);
            }

            modulo.semanas.push({
                semana: row.semana,
                titulo_semana: row.titulo_semana,
                tematica: row.tematica || 'Sin tema'
            });
        });

        const curriculum = Array.from(fasesMap.values());

        const totals = db.get<TotalCountsRow>(`
            SELECT 
                COUNT(DISTINCT m.id) as total_modules,
                COUNT(DISTINCT s.id) as total_weeks
            FROM modulos m
            LEFT JOIN semanas s ON m.id = s.modulo_id
        `);

        return {
            version: '9.1.0-repo',
            sourceType: 'sqlite-repo',
            totalModules: totals?.total_modules || 0,
            totalWeeks: totals?.total_weeks || 0,
            curriculum,
            metadata: { optimizedFor: 'navigation' }
        };
    }

    /**
     * Validate database integrity
     */
    validateDatabase() {
        const validations = {
            totalSemanas: db.get<{ count: number }>('SELECT COUNT(*) as count FROM semanas')?.count || 0,
            rangoSemanas: db.get<{ min: number; max: number }>('SELECT MIN(semana) as min, MAX(semana) as max FROM semanas') || { min: 0, max: 0 },
            totalFases: db.get<{ count: number }>('SELECT COUNT(*) as count FROM fases')?.count || 0,
            totalModulos: db.get<{ count: number }>('SELECT COUNT(*) as count FROM modulos')?.count || 0,
            totalEsquemasDiarios: db.get<{ count: number }>('SELECT COUNT(*) as count FROM esquema_diario')?.count || 0
        };

        const isValid = validations.totalSemanas === 100 &&
            validations.rangoSemanas.min === 1 &&
            validations.rangoSemanas.max === 100;

        return {
            isValid,
            validations,
            timestamp: new Date().toISOString()
        };
    }
}

export const curriculumRepository = new CurriculumRepository();
