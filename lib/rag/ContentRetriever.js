/**
 * Content Retriever (RAG Híbrido Avanzado)
 * Recupera contexto relevante del currículo Ecosistema 360 para inyectar en prompts.
 * 
 * Mejoras Fase 1:
 * - Reranking con LLM
 * - Query Expansion
 * - Metadata Filtering
 */
const db = require('../db');

class ContentRetriever {
    /**
     * Obtiene el contexto completo de una semana específica.
     * @param {number} weekNumber - Número de semana (1-52)
     * @returns {Object|null} Datos de la semana con temática, objetivos, etc.
     */
    getWeekContext(weekNumber) {
        const week = db.get(
            `SELECT s.*, m.titulo_modulo, f.titulo_fase, f.proposito as fase_proposito
             FROM semanas s
             LEFT JOIN modulos m ON s.modulo_id = m.id
             LEFT JOIN fases f ON m.fase_id = f.id
             WHERE s.semana = ?`,
            [weekNumber]
        );

        if (!week) return null;

        // Parsear campos JSON
        return {
            semana: week.semana,
            titulo: week.titulo_semana,
            tematica: week.tematica,
            objetivos: this._parseJson(week.objetivos),
            actividades: this._parseJson(week.actividades),
            recursos: this._parseJson(week.recursos),
            ejercicios: this._parseJson(week.ejercicios),
            guia_estudio: week.guia_estudio,
            modulo: week.titulo_modulo,
            fase: week.titulo_fase,
            proposito_fase: week.fase_proposito
        };
    }

    /**
     * Obtiene el esquema diario de una semana.
     * @param {number} weekNumber 
     * @returns {Array} Array de días con concepto y pomodoros
     */
    getDailyScheme(weekNumber) {
        const weekRow = db.get('SELECT id FROM semanas WHERE semana = ?', [weekNumber]);
        if (!weekRow) return [];

        const days = db.query(
            'SELECT dia, concepto, pomodoros FROM esquema_diario WHERE semana_id = ? ORDER BY dia',
            [weekRow.id]
        );

        return days.map(d => ({
            dia: d.dia,
            concepto: d.concepto,
            pomodoros: this._parseJson(d.pomodoros)
        }));
    }

    /**
     * Obtiene el contexto específico de un día y pomodoro.
     * @param {number} weekNumber 
     * @param {number} dayIndex - Índice del día (0-4)
     * @param {number} pomodoroIndex - Índice del pomodoro (0-N)
     * @returns {Object} Contexto completo para el prompt
     */
    getPomodoroContext(weekNumber, dayIndex, pomodoroIndex) {
        const weekContext = this.getWeekContext(weekNumber);
        if (!weekContext) {
            return { error: `Semana ${weekNumber} no encontrada en el currículo.` };
        }

        const dailyScheme = this.getDailyScheme(weekNumber);
        const dayData = dailyScheme[dayIndex];

        if (!dayData) {
            return {
                weekContext,
                error: `Día ${dayIndex + 1} no encontrado en semana ${weekNumber}.`
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
            dia: dayIndex + 1,
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
     * @param {number} weekNumber 
     * @param {number} dayIndex 
     * @param {number} pomodoroIndex 
     * @returns {string} Texto formateado para inyectar en prompt
     */
    buildPromptContext(weekNumber, dayIndex, pomodoroIndex) {
        const ctx = this.getPomodoroContext(weekNumber, dayIndex, pomodoroIndex);

        if (ctx.error && !ctx.weekContext) {
            return `⚠️ Error de contexto: ${ctx.error}`;
        }

        const lines = [
            `📚 CONTEXTO DEL CURRÍCULO ECOSISTEMA 360`,
            ``,
            `**Fase:** ${ctx.fase}`,
            `**Propósito de la Fase:** ${ctx.proposito_fase}`,
            `**Módulo:** ${ctx.modulo}`,
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
     * @param {string} keyword 
     * @param {number} limit 
     * @returns {Array}
     */
    searchWeeks(keyword, limit = 5) {
        const pattern = `%${keyword}%`;
        return db.query(
            `SELECT semana, titulo_semana, tematica 
             FROM semanas 
             WHERE titulo_semana LIKE ? OR tematica LIKE ?
             LIMIT ?`,
            [pattern, pattern, limit]
        );
    }

    /**
     * Búsqueda con filtro de metadata (semana, día).
     * Pre-filtra antes de hacer búsqueda semántica para mejor rendimiento.
     * @param {string} query 
     * @param {Object} filters - { weekNumber, dayIndex }
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async searchWithMetadata(query, filters = {}, limit = 5) {
        try {
            const { embeddingService } = require('./EmbeddingService');

            // Búsqueda semántica con filtros
            let results = await embeddingService.searchSimilar(query, limit * 2);

            // Aplicar filtros de metadata
            if (filters.weekNumber) {
                results = results.filter(r => r.semanaId === filters.weekNumber);
            }
            if (filters.dayIndex !== undefined) {
                results = results.filter(r => r.dia === filters.dayIndex);
            }

            return results.slice(0, limit);

        } catch (error) {
            console.warn('[ContentRetriever] Metadata search error:', error.message);
            return this.searchWeeks(query, limit);
        }
    }

    /**
     * Búsqueda híbrida avanzada con Query Expansion y Reranking.
     * @param {string} query - Texto de búsqueda
     * @param {Object} options - { limit, useExpansion, useReranking, filters }
     * @returns {Promise<Array>}
     */
    async searchAdvanced(query, options = {}) {
        const {
            limit = 5,
            useExpansion = true,
            useReranking = true,
            filters = {}
        } = options;

        let queries = [query];
        let allResults = [];

        // 1. Query Expansion
        if (useExpansion) {
            try {
                const { queryExpander } = require('./QueryExpander');
                queries = await queryExpander.expand(query, { useLLM: false }); // Solo sinónimos locales para velocidad
                console.log(`[ContentRetriever] Queries expandidas: ${queries.length}`);
            } catch (e) {
                console.warn('[ContentRetriever] Query expansion failed:', e.message);
            }
        }

        // 2. Búsqueda con cada query expandida
        for (const q of queries.slice(0, 3)) { // Máximo 3 queries
            const results = await this.searchWithMetadata(q, filters, limit);
            allResults.push(...results);
        }

        // 3. Deduplicar
        const seen = new Set();
        const deduped = allResults.filter(r => {
            const key = `${r.semanaId}-${r.dia}-${r.pomodoroIndex}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // 4. Reranking
        if (useReranking && deduped.length > limit) {
            try {
                const { reranker } = require('./Reranker');
                const reranked = reranker.rerankHeuristic(query, deduped, limit);
                console.log(`[ContentRetriever] Resultados rerankeados: ${reranked.length}`);
                return reranked;
            } catch (e) {
                console.warn('[ContentRetriever] Reranking failed:', e.message);
            }
        }

        return deduped.slice(0, limit);
    }

    /**
     * Búsqueda híbrida: combina keyword search + semantic search.
     * @param {string} query - Texto de búsqueda
     * @param {number} limit - Resultados máximos
     * @returns {Promise<Array>}
     */
    async searchHybrid(query, limit = 5) {
        // 1. Keyword search
        const keywordResults = this.searchWeeks(query, limit);

        // 2. Semantic search (si EmbeddingService está disponible)
        let semanticResults = [];
        try {
            const { embeddingService } = require('./EmbeddingService');
            semanticResults = await embeddingService.searchSimilar(query, limit);
        } catch (error) {
            console.warn('[ContentRetriever] Semantic search no disponible:', error.message);
        }

        // 3. Combinar y rankear resultados
        const combined = this._mergeResults(keywordResults, semanticResults, limit);
        return combined;
    }

    /**
     * Obtiene contexto relacionado al pomodoro actual.
     * Útil para enriquecer el prompt con temas similares vistos antes.
     * @param {number} currentWeek 
     * @param {string} concept - Concepto del día actual
     * @param {number} limit 
     * @returns {Promise<string>}
     */
    async getRelatedContext(currentWeek, concept, limit = 3) {
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
                    lines.push(`  - Semana ${item.semana}: ${item.titulo_semana}`);
                } else if (item.text) {
                    lines.push(`  - ${item.text.substring(0, 80)}...`);
                }
            }

            return lines.join('\n');
        } catch (error) {
            console.warn('[ContentRetriever] Error obteniendo contexto relacionado:', error.message);
            return '';
        }
    }

    /**
     * Combina resultados de keyword y semantic search.
     * @private
     */
    _mergeResults(keywordResults, semanticResults, limit) {
        const seen = new Set();
        const merged = [];

        // Añadir keyword results primero (alta precisión)
        for (const item of keywordResults) {
            const key = `week-${item.semana}`;
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
                    semana: item.semanaId,
                    dia: item.dia,
                    pomodoro: item.pomodoroIndex,
                    text: item.text,
                    source: 'semantic',
                    score: item.similarity
                });
            }
        }

        // Ordenar por score y retornar top N
        merged.sort((a, b) => b.score - a.score);
        return merged.slice(0, limit);
    }

    // Helper para parsear JSON de forma segura
    _parseJson(str) {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            return [];
        }
    }
}

// Exportar singleton
const contentRetriever = new ContentRetriever();
module.exports = { contentRetriever, ContentRetriever };
