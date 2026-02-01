/**
 * Memory Consolidator - Consolida historial largo en resumen
 * Reduce uso de tokens resumiendo interacciones antiguas.
 */
const geminiRouter = require('../ai/router/GeminiRouter');
const { sessionRepository } = require('../repositories/SessionRepository');
const db = require('../db');

class MemoryConsolidator {
    constructor(options = {}) {
        this.maxDetailedInteractions = options.maxDetailedInteractions || 10;
        this.consolidationThreshold = options.consolidationThreshold || 15;
    }

    /**
     * Consolida interacciones antiguas de una sesión.
     * @param {string} sessionId 
     * @returns {Promise<Object>}
     */
    async consolidate(sessionId) {
        const interactions = db.query(
            `SELECT * FROM session_interactions 
             WHERE session_id = ? 
             ORDER BY timestamp ASC`,
            [sessionId]
        );

        if (interactions.length < this.consolidationThreshold) {
            return {
                consolidated: false,
                reason: 'Below threshold',
                count: interactions.length
            };
        }

        // Separar antiguas vs recientes
        const toConsolidate = interactions.slice(0, -this.maxDetailedInteractions);
        const toKeep = interactions.slice(-this.maxDetailedInteractions);

        // Generar resumen de interacciones antiguas
        const summary = await this._generateSummary(toConsolidate);

        // Guardar resumen consolidado
        const consolidationId = `consolidation-${sessionId}-${Date.now()}`;
        db.run(`
            INSERT INTO session_interactions 
            (session_id, type, payload, timestamp)
            VALUES (?, 'CONSOLIDATED_SUMMARY', ?, datetime('now'))
        `, [sessionId, JSON.stringify({ summary, originalCount: toConsolidate.length })]);

        // Eliminar interacciones consolidadas (opcional, por ahora las marcamos)
        const idsToMark = toConsolidate.map(i => i.id).join(',');
        if (idsToMark) {
            db.run(`UPDATE session_interactions SET type = 'ARCHIVED' WHERE id IN (${idsToMark})`);
        }

        return {
            consolidated: true,
            consolidationId,
            archivedCount: toConsolidate.length,
            keptCount: toKeep.length,
            summary: summary.substring(0, 200) + '...'
        };
    }

    /**
     * Genera resumen usando LLM.
     * @param {Array} interactions 
     * @returns {Promise<string>}
     */
    async _generateSummary(interactions) {
        const interactionsSummary = interactions.map(i => {
            const payload = typeof i.payload === 'string' ? JSON.parse(i.payload) : i.payload;
            return `- ${i.type}: ${payload.topic || payload.lessonId || 'N/A'}`;
        }).join('\n');

        const prompt = `Resume estas interacciones de aprendizaje en un párrafo conciso:

${interactionsSummary}

El resumen debe capturar:
1. Temas principales estudiados
2. Resultados de quizzes (si hay)
3. Progreso general

Responde solo con el resumen (máximo 3 oraciones):`;

        try {
            const response = await geminiRouter.analyze({ prompt, temperature: 0.3 });
            return typeof response === 'string' ? response : response.analysis || interactionsSummary;
        } catch (e) {
            // Fallback: resumen simple
            const topics = new Set();
            interactions.forEach(i => {
                const payload = typeof i.payload === 'string' ? JSON.parse(i.payload) : i.payload;
                if (payload.topic) topics.add(payload.topic);
            });
            return `Estudiante revisó: ${[...topics].slice(0, 5).join(', ')}. Total ${interactions.length} interacciones.`;
        }
    }

    /**
     * Obtiene contexto consolidado para prompt.
     * @param {string} sessionId 
     * @returns {string}
     */
    getConsolidatedContext(sessionId) {
        // Obtener resúmenes consolidados
        const summaries = db.query(
            `SELECT payload FROM session_interactions 
             WHERE session_id = ? AND type = 'CONSOLIDATED_SUMMARY'
             ORDER BY timestamp DESC LIMIT 1`,
            [sessionId]
        );

        // Obtener interacciones recientes
        const recent = db.query(
            `SELECT type, payload, timestamp FROM session_interactions 
             WHERE session_id = ? AND type NOT IN ('ARCHIVED', 'CONSOLIDATED_SUMMARY')
             ORDER BY timestamp DESC LIMIT ?`,
            [sessionId, this.maxDetailedInteractions]
        );

        const parts = [];

        // Añadir resumen si existe
        if (summaries.length > 0) {
            const payload = JSON.parse(summaries[0].payload);
            parts.push(`**Historial resumido:** ${payload.summary}`);
        }

        // Añadir recientes
        if (recent.length > 0) {
            parts.push('**Actividad reciente:**');
            recent.reverse().forEach(r => {
                const p = JSON.parse(r.payload);
                parts.push(`- ${r.type}: ${p.topic || p.lessonId || ''}`);
            });
        }

        return parts.join('\n');
    }
}

// Exportar singleton
const memoryConsolidator = new MemoryConsolidator();
module.exports = { memoryConsolidator, MemoryConsolidator };
