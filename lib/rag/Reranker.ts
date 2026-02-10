/**
 * Reranker - Reordena resultados de búsqueda usando LLM
 * Mejora la precisión del RAG reordenando los documentos por relevancia.
 */
import { geminiRouter } from '../ai/router/GeminiRouter';

export interface RerankDocument {
    id: string;
    text?: string;
    content?: string;
    score?: number;
    [key: string]: any;
}

export class Reranker {
    private topK: number;
    private batchSize: number;

    constructor(options: { topK?: number; batchSize?: number } = {}) {
        this.topK = options.topK || 3;
        this.batchSize = options.batchSize || 10;
    }

    /**
     * Reordena documentos por relevancia usando el LLM.
     */
    async rerank(query: string, documents: RerankDocument[], topK: number = this.topK): Promise<RerankDocument[]> {
        if (!documents || documents.length === 0) {
            return [];
        }

        // Si hay pocos documentos, no vale la pena reranking
        if (documents.length <= topK) {
            return documents;
        }

        try {
            const prompt = this._buildRerankPrompt(query, documents);

            const response = await geminiRouter.analyze({
                userPrompt: prompt,
                analysisType: 'json'
            });

            // Extraer el ranking de la respuesta del router
            const ranking = this._parseRankingResponse(response.analysis, documents);
            return ranking.slice(0, topK);

        } catch (error: any) {
            console.error('[Reranker] Error, retornando orden original:', error.message);
            return documents.slice(0, topK);
        }
    }

    /**
     * Construye el prompt para reranking.
     */
    private _buildRerankPrompt(query: string, documents: RerankDocument[]): string {
        const docList = documents.slice(0, this.batchSize).map((doc, i) =>
            `[${i}] ${doc.text?.substring(0, 200) || doc.content?.substring(0, 200)}...`
        ).join('\n\n');

        return `Ordena los siguientes documentos por relevancia para la consulta.

**CONSULTA:** ${query}

**DOCUMENTOS:**
${docList}

**INSTRUCCIONES:**
- Ordena del más relevante al menos relevante
- Responde SOLO con JSON: { "ranking": [indices ordenados] }
- Ejemplo: { "ranking": [2, 0, 5, 1, 3, 4] }

**RESPUESTA:**`;
    }

    /**
     * Parsea la respuesta del LLM y reordena los documentos.
     */
    private _parseRankingResponse(response: any, originalDocs: RerankDocument[]): RerankDocument[] {
        try {
            let parsed: any;
            if (typeof response === 'string') {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } else {
                parsed = response;
            }

            if (parsed?.ranking && Array.isArray(parsed.ranking)) {
                return parsed.ranking
                    .filter((idx: number) => idx >= 0 && idx < originalDocs.length)
                    .map((idx: number) => originalDocs[idx]);
            }

            return originalDocs;

        } catch (e: any) {
            console.error('[Reranker] Error parsing response:', e.message);
            return originalDocs;
        }
    }

    /**
     * Reranking ligero usando scoring heurístico (sin LLM).
     */
    rerankHeuristic(query: string, documents: RerankDocument[], topK: number = this.topK): RerankDocument[] {
        const queryTerms = query.toLowerCase().split(/\s+/);

        const scored = documents.map(doc => {
            const text = (doc.text || doc.content || '').toLowerCase();

            // Score basado en coincidencia de términos
            let score = doc.score || 0;
            for (const term of queryTerms) {
                if (text.includes(term)) {
                    score += 0.1;
                }
            }

            // Bonus por coincidencia exacta de frase
            if (text.includes(query.toLowerCase())) {
                score += 0.5;
            }

            return { ...doc, rerankScore: score };
        });

        return scored
            .sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0))
            .slice(0, topK);
    }
}

// Exportar singleton
export const reranker = new Reranker();
