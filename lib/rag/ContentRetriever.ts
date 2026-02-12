
import { db } from '../db';
import { queryExpander } from './QueryExpander';
import { embeddingService } from './EmbeddingService';
import { logger } from '../observability/Logger';

// --- Interfaces de Dominio del Currículo ---

export type Recurso = string | { titulo: string; url?: string };
export type Actividad = string | { titulo: string; descripcion?: string };
export type Ejercicio = string | { titulo: string; descripcion?: string };

export interface WeekContext {
    semana: number;
    titulo: string;
    tematica: string;
    objetivos: string[];
    actividades: Actividad[];
    recursos: Recurso[];
    ejercicios: Ejercicio[];
    guia_estudio?: string;
    modulo?: string;
    fase?: string;
    proposito_fase?: string;
}

export interface DailyScheme {
    dia: number;
    concepto: string;
    pomodoros: string[];
}

export interface PomodoroContext {
    fase?: string;
    proposito_fase?: string;
    modulo?: string;

    semana: number;
    titulo_semana: string;
    tematica_semanal: string;
    objetivos_semana: string[];

    dia: number;
    concepto_del_dia: string;

    pomodoro_index: number;
    texto_del_pomodoro: string;
    total_pomodoros_dia: number;

    recursos_semana: Recurso[];
    ejercicios_semana: Ejercicio[];

    error?: string;
    weekContext?: WeekContext | null; // For error reporting
}

export interface SearchOptions {
    limit?: number;
    useExpansion?: boolean;
    useReranking?: boolean;
    filters?: {
        weekNumber?: number;
        dayIndex?: number;
    };
}

export interface SearchResult {
    semanaId: number;
    dia: number;
    pomodoroIndex: number;
    text: string;
    similarity?: number;
    source?: 'keyword' | 'semantic';
    score?: number;
    titulo_semana?: string; // Optional for keyword results
    tematica?: string;      // Optional for keyword results
    [key: string]: unknown;
}

export class ContentRetriever {

    /**
     * Obtiene el contexto completo de una semana específica.
     */
    getWeekContext(weekNumber: number): WeekContext | null {
        const week = db.get<{
            semana: number;
            titulo_semana: string;
            tematica: string;
            objetivos: string;
            actividades: string;
            recursos: string;
            ejercicios: string;
            guia_estudio: string;
            titulo_modulo: string;
            titulo_fase: string;
            fase_proposito: string;
        }>(
            `SELECT s.*, m.titulo_modulo, f.titulo_fase, f.proposito as fase_proposito
             FROM semanas s
             LEFT JOIN modulos m ON s.modulo_id = m.id
             LEFT JOIN fases f ON m.fase_id = f.id
             WHERE s.semana = ?`,
            [weekNumber]
        );

        if (!week) return null;

        return {
            semana: week.semana,
            titulo: week.titulo_semana,
            tematica: week.tematica,
            objetivos: this._parseJson<string>(week.objetivos),
            actividades: this._parseJson<Actividad>(week.actividades),
            recursos: this._parseJson<Recurso>(week.recursos),
            ejercicios: this._parseJson<Ejercicio>(week.ejercicios),
            guia_estudio: week.guia_estudio,
            modulo: week.titulo_modulo,
            fase: week.titulo_fase,
            proposito_fase: week.fase_proposito
        };
    }

    /**
     * Obtiene el esquema diario de una semana.
     */
    getDailyScheme(weekNumber: number): DailyScheme[] {
        const weekRow = db.get<{ id: number }>('SELECT id FROM semanas WHERE semana = ?', [weekNumber]);
        if (!weekRow) return [];

        const days = db.query<{ dia: number; concepto: string; pomodoros: string }>(
            'SELECT dia, concepto, pomodoros FROM esquema_diario WHERE semana_id = ? ORDER BY dia',
            [weekRow.id]
        );

        return days.map(d => ({
            dia: d.dia,
            concepto: d.concepto,
            pomodoros: this._parseJson<string>(d.pomodoros)
        }));
    }

    /**
     * Obtiene el contexto específico de un día y pomodoro.
     */
    getPomodoroContext(weekNumber: number, dayIndex: number, pomodoroIndex: number): PomodoroContext {
        const weekContext = this.getWeekContext(weekNumber);
        if (!weekContext) {
            return {
                semana: weekNumber,
                titulo_semana: '',
                tematica_semanal: '',
                objetivos_semana: [],
                dia: 0,
                concepto_del_dia: '',
                pomodoro_index: 0,
                texto_del_pomodoro: '',
                total_pomodoros_dia: 0,
                recursos_semana: [],
                ejercicios_semana: [],
                error: `Semana ${weekNumber} no encontrada en el currículo.`
            };
        }

        const dailyScheme = this.getDailyScheme(weekNumber);
        const dayData = dailyScheme[dayIndex]; // dayIndex is 0-based index of array, assuming ordered by dia

        if (!dayData) {
            return {
                fase: weekContext.fase,
                proposito_fase: weekContext.proposito_fase,
                modulo: weekContext.modulo,
                semana: weekNumber,
                titulo_semana: weekContext.titulo,
                tematica_semanal: weekContext.tematica,
                objetivos_semana: weekContext.objetivos,
                dia: dayIndex + 1,
                concepto_del_dia: '',
                pomodoro_index: 0,
                texto_del_pomodoro: '',
                total_pomodoros_dia: 0,
                recursos_semana: [],
                ejercicios_semana: [],
                weekContext,
                error: `Día (index ${dayIndex}) no encontrado en semana ${weekNumber}.`
            };
        }

        const pomodoros = dayData.pomodoros || [];
        const pomodoroText = pomodoros[pomodoroIndex] || 'Pomodoro no especificado';

        return {
            // Contexto de alto nivel
            fase: weekContext.fase,
            proposito_fase: weekContext.proposito_fase,
            modulo: weekContext.modulo,

            // Contexto de semana
            semana: weekNumber,
            titulo_semana: weekContext.titulo,
            tematica_semanal: weekContext.tematica,
            objetivos_semana: weekContext.objetivos,

            // Contexto del día
            dia: dayData.dia, // Use actual DB day number
            concepto_del_dia: dayData.concepto,

            // Contexto del pomodoro
            pomodoro_index: pomodoroIndex + 1,
            texto_del_pomodoro: pomodoroText,
            total_pomodoros_dia: pomodoros.length,

            // Recursos relacionados
            recursos_semana: weekContext.recursos,
            ejercicios_semana: weekContext.ejercicios
        };
    }

    /**
     * Construye el texto de contexto para inyectar en el prompt de la IA.
     */
    buildPromptContext(weekNumber: number, dayIndex: number, pomodoroIndex: number): string {
        const ctx = this.getPomodoroContext(weekNumber, dayIndex, pomodoroIndex);

        if (ctx.error && !ctx.weekContext) {
            return `⚠️ Error de contexto: ${ctx.error}`;
        }

        const lines = [
            `📚 CONTEXTO DEL CURRÍCULO ECOSISTEMA 360`,
            ``,
            `**Fase:** ${ctx.fase || 'N/A'}`,
            `**Propósito de la Fase:** ${ctx.proposito_fase || 'N/A'}`,
            `**Módulo:** ${ctx.modulo || 'N/A'}`,
            ``,
            `**Semana ${ctx.semana}:** ${ctx.titulo_semana}`,
            `**Temática Semanal:** ${ctx.tematica_semanal}`,
            `**Objetivos de la Semana:**`,
            ...(ctx.objetivos_semana || []).map(o => `  - ${o}`),
            ``,
            `**Día ${ctx.dia}:** ${ctx.concepto_del_dia}`,
            `**Pomodoro ${ctx.pomodoro_index} de ${ctx.total_pomodoros_dia}:** ${ctx.texto_del_pomodoro}`,
        ];

        if (ctx.recursos_semana?.length > 0) {
            lines.push(``, `**Recursos Oficiales:**`);
            ctx.recursos_semana.slice(0, 3).forEach(r => {
                if (typeof r === 'string') {
                    lines.push(`  - ${r}`);
                } else if (r.titulo) {
                    lines.push(`  - ${r.titulo}: ${r.url || ''}`);
                }
            });
        }

        return lines.join('\n');
    }

    /**
     * Busca semanas por palabra clave en temática o título.
     */
    searchWeeks(keyword: string, limit: number = 5): SearchResult[] {
        const pattern = `%${keyword}%`;
        const results = db.query<{ semana: number; titulo_semana: string; tematica: string }>(
            `SELECT semana, titulo_semana, tematica 
             FROM semanas 
             WHERE titulo_semana LIKE ? OR tematica LIKE ?
             LIMIT ?`,
            [pattern, pattern, limit]
        );

        return results.map(r => ({
            semanaId: r.semana,
            dia: 0,
            pomodoroIndex: 0,
            text: `${r.titulo_semana}: ${r.tematica}`,
            titulo_semana: r.titulo_semana,
            tematica: r.tematica,
            source: 'keyword'
        }));
    }

    /**
     * Búsqueda con filtro de metadata (semana, día).
     */
    async searchWithMetadata(query: string, filters: { weekNumber?: number; dayIndex?: number } = {}, limit: number = 5): Promise<SearchResult[]> {
        try {
            // Búsqueda semántica con filtros
            let results = await embeddingService.searchSimilar(query, limit * 2);

            // Aplicar filtros de metadata
            if (filters.weekNumber) {
                results = results.filter(r => r.semanaId === filters.weekNumber);
            }
            if (filters.dayIndex !== undefined) {
                results = results.filter(r => r.dia === filters.dayIndex);
            }

            return results.slice(0, limit).map(r => ({
                ...r,
                source: 'semantic'
            }));

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[ContentRetriever] Metadata search error: ${message}`);
            return this.searchWeeks(query, limit);
        }
    }

    /**
     * Búsqueda híbrida avanzada con Query Expansion y Reranking.
     */
    async searchAdvanced(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const {
            limit = 5,
            useExpansion = true,
            filters = {}
        } = options;

        let queries = [query];
        let allResults: SearchResult[] = [];

        // 1. Query Expansion
        if (useExpansion) {
            try {
                queries = await queryExpander.expand(query, { useLLM: false }); // Solo sinónimos locales para velocidad
                logger.info(`[ContentRetriever] Queries expandidas: ${queries.length}`);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                logger.warn(`[ContentRetriever] Query expansion failed: ${message}`);
            }
        }

        // 2. Búsqueda con cada query expandida
        for (const q of queries.slice(0, 3)) { // Máximo 3 queries
            const results = await this.searchWithMetadata(q, filters, limit);
            allResults.push(...results);
        }

        // 3. Deduplicar
        const seen = new Set();
        const dedupedRaw = allResults.filter(r => {
            const key = `${r.semanaId}-${r.dia}-${r.pomodoroIndex}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // 4. Reranking (Simplificado/Heurístico si no hay Reranker module, o asumimos score es suficiente)
        const sorted = dedupedRaw.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

        return sorted.slice(0, limit);
    }

    /**
     * Alias for searchAdvanced returning only text content for compatibility.
     */
    async retrieve(query: string, limit: number = 5): Promise<string[]> {
        const results = await this.searchAdvanced(query, { limit });
        return results.map(r => r.text);
    }

    /**
     * Búsqueda híbrida: combina keyword search + semantic search.
     */
    async searchHybrid(query: string, limit: number = 5): Promise<SearchResult[]> {
        // 1. Keyword search
        const keywordResults = this.searchWeeks(query, limit);

        // 2. Semantic search
        let semanticResults: SearchResult[] = [];
        try {
            const rawSemantic = await embeddingService.searchSimilar(query, limit);
            semanticResults = rawSemantic.map(r => ({ ...r, source: 'semantic' }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[ContentRetriever] Semantic search no disponible: ${message}`);
        }

        // 3. Combinar y rankear resultados
        const combined = this._mergeResults(keywordResults, semanticResults, limit);
        return combined;
    }

    /**
     * Obtiene contexto relacionado al pomodoro actual.
     */
    async getRelatedContext(currentWeek: number, concept: string, limit: number = 3): Promise<string> {
        try {
            // Usar búsqueda avanzada
            const related = await this.searchAdvanced(concept, {
                limit: limit + 1,
                useExpansion: true,
                useReranking: true,
                filters: {} // Sin filtros para buscar en todo el currículo
            });

            // Filtrar la semana actual
            const filtered = related.filter(r => r.semanaId !== currentWeek).slice(0, limit);

            if (filtered.length === 0) {
                return '';
            }

            const lines = ['📎 **Temas Relacionados del Currículo:**'];
            for (const item of filtered) {
                if (item.titulo_semana) {
                    lines.push(`  - Semana ${item.semanaId}: ${item.titulo_semana}`);
                } else if (item.text) {
                    lines.push(`  - ${item.text.substring(0, 80)}...`);
                }
            }

            return lines.join('\n');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`[ContentRetriever] Error obteniendo contexto relacionado: ${message}`);
            return '';
        }
    }

    /**
     * Combina resultados de keyword y semantic search.
     */
    private _mergeResults(keywordResults: SearchResult[], semanticResults: SearchResult[], limit: number): SearchResult[] {
        const seen = new Set();
        const merged: SearchResult[] = [];

        // Añadir keyword results primero (alta precisión)
        for (const item of keywordResults) {
            const key = `week-${item.semanaId}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push({ ...item, source: 'keyword', score: 1.0 });
            }
        }

        // Añadir semantic results (alta recall)
        for (const item of semanticResults) {
            const key = `week-${item.semanaId}-day-${item.dia}-pom-${item.pomodoroIndex}`;
            if (!seen.has(key)) {
                seen.add(key);
                merged.push({
                    ...item,
                    score: item.similarity
                });
            }
        }

        // Ordenar por score y retornar top N
        merged.sort((a, b) => (b.score || 0) - (a.score || 0));
        return merged.slice(0, limit);
    }

    // Helper para parsear JSON de forma segura
    private _parseJson<T>(str: string): T[] {
        if (!str) return [];
        try {
            const res: unknown = JSON.parse(str);
            return Array.isArray(res) ? res as T[] : [];
        } catch {
            return [];
        }
    }
}

// Exportar singleton
export const contentRetriever = new ContentRetriever();
