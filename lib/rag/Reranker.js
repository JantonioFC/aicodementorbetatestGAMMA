/**
 * Reranker - Reordena resultados de búsqueda usando LLM
 * Mejora la precisión del RAG reordenando los documentos por relevancia.
 */
const geminiRouter = require('../ai/router/GeminiRouter');

class Reranker {
    constructor(options = {}) {
        this.topK = options.topK || 3;
        this.batchSize = options.batchSize || 10;
    }

    /**
     * Reordena documentos por relevancia usando el LLM.
     * @param {string} query - La consulta original
     * @param {Array} documents - Array de { id, text, score }
     * @param {number} topK - Cuántos documentos retornar
     * @returns {Promise<Array>} Documentos reordenados
     */
    async rerank(query, documents, topK = this.topK) {
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
                prompt,
                responseType: 'json',
                temperature: 0.1
            });

            const ranking = this._parseRankingResponse(response, documents);
            return ranking.slice(0, topK);

        } catch (error) {
            console.error('[Reranker] Error, retornando orden original:', error.message);
            return documents.slice(0, topK);
        }
    }

    /**
     * Construye el prompt para reranking.
     */
    _buildRerankPrompt(query, documents) {
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
    _parseRankingResponse(response, originalDocs) {
        try {
            let parsed;
            if (typeof response === 'string') {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } else {
                parsed = response;
            }

            if (parsed?.ranking && Array.isArray(parsed.ranking)) {
                return parsed.ranking
                    .filter(idx => idx >= 0 && idx < originalDocs.length)
                    .map(idx => originalDocs[idx]);
            }

            return originalDocs;

        } catch (e) {
            console.error('[Reranker] Error parsing response:', e.message);
            return originalDocs;
        }
    }

    /**
     * Reranking ligero usando scoring heurístico (sin LLM).
     * Útil para fallback o cuando se necesita velocidad.
     */
    rerankHeuristic(query, documents, topK = this.topK) {
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
            .sort((a, b) => b.rerankScore - a.rerankScore)
            .slice(0, topK);
    }
}

// Exportar singleton
const reranker = new Reranker();
module.exports = { reranker, Reranker };
