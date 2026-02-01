/**
 * Text Metrics - Métricas de evaluación de texto
 * Implementa ROUGE, BLEU y otras métricas para evaluar generación de texto.
 */

class TextMetrics {
    /**
     * Calcula ROUGE-L (Longest Common Subsequence).
     * Mide el overlap de secuencias más largas entre generado y referencia.
     * @param {string} generated - Texto generado
     * @param {string} reference - Texto de referencia
     * @returns {Object} { precision, recall, f1 }
     */
    calculateROUGE_L(generated, reference) {
        const genTokens = this._tokenize(generated);
        const refTokens = this._tokenize(reference);

        const lcsLength = this._lcs(genTokens, refTokens);

        const precision = genTokens.length > 0 ? lcsLength / genTokens.length : 0;
        const recall = refTokens.length > 0 ? lcsLength / refTokens.length : 0;
        const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        return {
            precision: Math.round(precision * 100) / 100,
            recall: Math.round(recall * 100) / 100,
            f1: Math.round(f1 * 100) / 100
        };
    }

    /**
     * Calcula ROUGE-1 (Unigram overlap).
     * @param {string} generated 
     * @param {string} reference 
     * @returns {Object} { precision, recall, f1 }
     */
    calculateROUGE_1(generated, reference) {
        const genTokens = new Set(this._tokenize(generated));
        const refTokens = new Set(this._tokenize(reference));

        const overlap = [...genTokens].filter(t => refTokens.has(t)).length;

        const precision = genTokens.size > 0 ? overlap / genTokens.size : 0;
        const recall = refTokens.size > 0 ? overlap / refTokens.size : 0;
        const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

        return {
            precision: Math.round(precision * 100) / 100,
            recall: Math.round(recall * 100) / 100,
            f1: Math.round(f1 * 100) / 100
        };
    }

    /**
     * Calcula BLEU-1 simplificado (unigram precision).
     * @param {string} generated 
     * @param {string} reference 
     * @returns {number} Score 0-1
     */
    calculateBLEU(generated, reference) {
        const genTokens = this._tokenize(generated);
        const refTokens = this._tokenize(reference);
        const refSet = new Set(refTokens);

        if (genTokens.length === 0) return 0;

        const matches = genTokens.filter(t => refSet.has(t)).length;
        const precision = matches / genTokens.length;

        // Brevity penalty
        const bp = genTokens.length >= refTokens.length ? 1 :
            Math.exp(1 - refTokens.length / genTokens.length);

        return Math.round(bp * precision * 100) / 100;
    }

    /**
     * Calcula coherencia con el contexto RAG.
     * Mide qué tan bien la respuesta utiliza el contexto proporcionado.
     * @param {string} generated 
     * @param {string} ragContext 
     * @returns {Object} { groundedness, coverage }
     */
    calculateGroundedness(generated, ragContext) {
        const genTokens = this._tokenize(generated);
        const ragTokens = new Set(this._tokenize(ragContext));

        // Groundedness: qué porcentaje del texto generado viene del contexto
        const grounded = genTokens.filter(t => ragTokens.has(t) && t.length > 3).length;
        const groundedness = genTokens.length > 0 ? grounded / genTokens.length : 0;

        // Coverage: qué porcentaje del contexto fue usado
        const genSet = new Set(genTokens);
        const used = [...ragTokens].filter(t => genSet.has(t) && t.length > 3).length;
        const coverage = ragTokens.size > 0 ? used / ragTokens.size : 0;

        return {
            groundedness: Math.round(groundedness * 100) / 100,
            coverage: Math.round(coverage * 100) / 100
        };
    }

    /**
     * Calcula todas las métricas de una vez.
     * @param {string} generated 
     * @param {string} reference 
     * @param {string} ragContext - Opcional
     * @returns {Object}
     */
    calculateAll(generated, reference, ragContext = null) {
        const metrics = {
            rouge1: this.calculateROUGE_1(generated, reference),
            rougeL: this.calculateROUGE_L(generated, reference),
            bleu: this.calculateBLEU(generated, reference)
        };

        if (ragContext) {
            metrics.groundedness = this.calculateGroundedness(generated, ragContext);
        }

        // Score combinado
        metrics.overall = Math.round(
            (metrics.rouge1.f1 * 0.3 + metrics.rougeL.f1 * 0.3 + metrics.bleu * 0.4) * 100
        ) / 100;

        return metrics;
    }

    /**
     * Tokeniza texto en palabras.
     * @private
     */
    _tokenize(text) {
        if (!text) return [];
        return text
            .toLowerCase()
            .replace(/[^\w\sáéíóúñü]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }

    /**
     * Calcula la longitud de la subsecuencia común más larga (LCS).
     * @private
     */
    _lcs(arr1, arr2) {
        const m = arr1.length;
        const n = arr2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (arr1[i - 1] === arr2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp[m][n];
    }
}

// Exportar singleton
const textMetrics = new TextMetrics();
module.exports = { textMetrics, TextMetrics };
