/**
 * Memory Consolidator - Consolida historial largo en resumen
 * Reduce uso de tokens resumiendo interacciones antiguas.
 */
import { geminiRouter } from '../ai/router/GeminiRouter';
import { db } from '../db';

export interface ConsolidationResult {
    consolidated: boolean;
    reason?: string;
    count?: number;
    consolidationId?: string;
    archivedCount?: number;
    keptCount?: number;
    summary?: string;
}

interface SessionInteraction {
    id: number;
    session_id: string;
    type: string;
    payload: string | Record<string, unknown>;
    timestamp: string;
}

export class MemoryConsolidator {
    private maxDetailedInteractions: number;
    private consolidationThreshold: number;

    constructor(options: { maxDetailedInteractions?: number; consolidationThreshold?: number } = {}) {
        this.maxDetailedInteractions = options.maxDetailedInteractions || 10;
        this.consolidationThreshold = options.consolidationThreshold || 15;
    }

    /**
     * Consolida interacciones antiguas de una sesión.
     */
    async consolidate(sessionId: string): Promise<ConsolidationResult> {
        const interactions = db.query<SessionInteraction>(
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

        // Eliminar interacciones consolidadas (marcar como ARCHIVED)
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
     */
    private async _generateSummary(interactions: SessionInteraction[]): Promise<string> {
        const interactionsSummary = interactions.map(i => {
            const payload = typeof i.payload === 'string' ? JSON.parse(i.payload) as Record<string, unknown> : i.payload;
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
            const response = await geminiRouter.analyze({
                userPrompt: prompt,
                analysisType: 'text'
            });
            // Adaptado a la estructura AnalysisResponse
            return response.analysis?.feedback || interactionsSummary;
        } catch (e: unknown) {
            // Fallback: resumen simple
            const topics = new Set<string>();
            interactions.forEach(i => {
                const payload = typeof i.payload === 'string' ? JSON.parse(i.payload) as Record<string, unknown> : i.payload;
                if (payload.topic && typeof payload.topic === 'string') topics.add(payload.topic);
            });
            return `Estudiante revisó: ${[...topics].slice(0, 5).join(', ')}. Total ${interactions.length} interacciones.`;
        }
    }

    /**
     * Obtiene contexto consolidado para prompt.
     */
    getConsolidatedContext(sessionId: string): string {
        // Obtener resúmenes consolidados
        const summaries = db.query<{ payload: string }>(
            `SELECT payload FROM session_interactions 
             WHERE session_id = ? AND type = 'CONSOLIDATED_SUMMARY'
             ORDER BY timestamp DESC LIMIT 1`,
            [sessionId]
        );

        // Obtener interacciones recientes
        const recent = db.query<{ type: string, payload: string, timestamp: string }>(
            `SELECT type, payload, timestamp FROM session_interactions 
             WHERE session_id = ? AND type NOT IN ('ARCHIVED', 'CONSOLIDATED_SUMMARY')
             ORDER BY timestamp DESC LIMIT ?`,
            [sessionId, this.maxDetailedInteractions]
        );

        const parts: string[] = [];

        // Añadir resumen si existe
        if (summaries.length > 0) {
            const payload = JSON.parse(summaries[0].payload) as { summary?: string };
            if (payload.summary) {
                parts.push(`**Historial resumido:** ${payload.summary}`);
            }
        }

        // Añadir recientes
        if (recent.length > 0) {
            parts.push('**Actividad reciente:**');
            recent.reverse().forEach(r => {
                const p = JSON.parse(r.payload) as Record<string, unknown>;
                parts.push(`- ${r.type}: ${p.topic || p.lessonId || ''}`);
            });
        }

        return parts.join('\n');
    }
}

// Exportar singleton
export const memoryConsolidator = new MemoryConsolidator();
