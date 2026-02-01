/**
 * Token Budget Manager
 * Gestiona el tamaño del prompt para evitar exceder la ventana de contexto del LLM.
 * Parte de Phase 7: Priority Corrections
 */

class TokenBudgetManager {
    /**
     * @param {number} maxTokens - Límite máximo de tokens del modelo
     * @param {number} reservedForOutput - Tokens reservados para la respuesta
     */
    constructor(maxTokens = 8000, reservedForOutput = 2000) {
        this.maxTokens = maxTokens;
        this.reservedForOutput = reservedForOutput;
        this.availableBudget = maxTokens - reservedForOutput;
    }

    /**
     * Estima el número de tokens en un texto.
     * Aproximación: 1 token ≈ 3.5 caracteres para español/inglés mixto.
     * @param {string} text 
     * @returns {number}
     */
    estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 3.5);
    }

    /**
     * Verifica si un prompt cabe en el budget.
     * @param {string} prompt 
     * @returns {{fits: boolean, estimated: number, available: number}}
     */
    checkBudget(prompt) {
        const estimated = this.estimateTokens(prompt);
        return {
            fits: estimated <= this.availableBudget,
            estimated,
            available: this.availableBudget,
            usage: Math.round((estimated / this.availableBudget) * 100)
        };
    }

    /**
     * Ajusta componentes del prompt para caber en el budget.
     * Prioridad de recorte: fewShot < rag < session < user (el user nunca se recorta)
     * @param {Object} components - { system, fewShot, session, rag, user }
     * @returns {Object} Componentes ajustados + metadata
     */
    fitWithinBudget(components) {
        const { system = '', fewShot = '', session = '', rag = '', user = '' } = components;

        // Calcular tokens de cada componente
        const tokens = {
            system: this.estimateTokens(system),
            fewShot: this.estimateTokens(fewShot),
            session: this.estimateTokens(session),
            rag: this.estimateTokens(rag),
            user: this.estimateTokens(user)
        };

        const totalTokens = Object.values(tokens).reduce((a, b) => a + b, 0);

        // Si cabe, retornar sin cambios
        if (totalTokens <= this.availableBudget) {
            return {
                components,
                wasAdjusted: false,
                originalTokens: totalTokens,
                finalTokens: totalTokens
            };
        }

        // Necesitamos recortar
        const adjustedComponents = { ...components };
        let currentTokens = totalTokens;
        const adjustments = [];

        // 1. Primero recortar Few-Shot (menos crítico)
        if (currentTokens > this.availableBudget && fewShot) {
            const targetFewShotTokens = Math.floor(this.availableBudget * 0.1); // Max 10% para ejemplos
            if (tokens.fewShot > targetFewShotTokens) {
                adjustedComponents.fewShot = this._truncateToTokens(fewShot, targetFewShotTokens);
                currentTokens -= (tokens.fewShot - targetFewShotTokens);
                adjustments.push(`fewShot: ${tokens.fewShot} → ${targetFewShotTokens}`);
            }
        }

        // 2. Luego recortar RAG (mantener lo esencial)
        if (currentTokens > this.availableBudget && rag) {
            const targetRagTokens = Math.floor(this.availableBudget * 0.3); // Max 30% para RAG
            if (tokens.rag > targetRagTokens) {
                adjustedComponents.rag = this._truncateToTokens(rag, targetRagTokens);
                currentTokens -= (tokens.rag - targetRagTokens);
                adjustments.push(`rag: ${tokens.rag} → ${targetRagTokens}`);
            }
        }

        // 3. Finalmente recortar Session si aún no cabe
        if (currentTokens > this.availableBudget && session) {
            const targetSessionTokens = Math.floor(this.availableBudget * 0.1); // Max 10% para session
            if (tokens.session > targetSessionTokens) {
                adjustedComponents.session = this._truncateToTokens(session, targetSessionTokens);
                currentTokens -= (tokens.session - targetSessionTokens);
                adjustments.push(`session: ${tokens.session} → ${targetSessionTokens}`);
            }
        }

        return {
            components: adjustedComponents,
            wasAdjusted: true,
            originalTokens: totalTokens,
            finalTokens: currentTokens,
            adjustments
        };
    }

    /**
     * Trunca texto para caber en un número aproximado de tokens.
     * @param {string} text 
     * @param {number} targetTokens 
     * @returns {string}
     */
    _truncateToTokens(text, targetTokens) {
        const targetChars = Math.floor(targetTokens * 3.5);
        if (text.length <= targetChars) return text;

        // Truncar y añadir indicador
        return text.substring(0, targetChars - 20) + '\n\n[...truncado]';
    }

    /**
     * Genera un reporte de uso del budget.
     * @param {string} prompt 
     * @returns {string}
     */
    getUsageReport(prompt) {
        const check = this.checkBudget(prompt);
        const bar = '█'.repeat(Math.floor(check.usage / 5)) + '░'.repeat(20 - Math.floor(check.usage / 5));
        return `Token Budget: [${bar}] ${check.usage}% (${check.estimated}/${check.available})`;
    }
}

// Configuraciones predefinidas para diferentes modelos
const GEMINI_PRO_BUDGET = new TokenBudgetManager(30000, 4000);
const GEMINI_FLASH_BUDGET = new TokenBudgetManager(100000, 8000);
const DEFAULT_BUDGET = new TokenBudgetManager(8000, 2000);

module.exports = {
    TokenBudgetManager,
    GEMINI_PRO_BUDGET,
    GEMINI_FLASH_BUDGET,
    DEFAULT_BUDGET
};
