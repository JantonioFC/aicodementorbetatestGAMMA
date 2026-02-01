/**
 * Context Window Manager
 * Gestiona el contexto de manera inteligente para optimizar uso del LLM.
 * Basado en skill: context-window-management
 */

class ContextWindowManager {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 8000;
        this.reserveForOutput = options.reserveForOutput || 2000;
        this.availableTokens = this.maxTokens - this.reserveForOutput;

        // Prioridades para componentes del contexto
        this.priorities = {
            systemPrompt: 100,      // Siempre
            currentQuery: 95,       // Casi siempre
            criticalInstructions: 90, // Inicio del prompt
            fewShotExamples: 70,    // Importante
            ragContext: 60,         // Útil
            sessionHistory: 50,     // Medio
            studentProfile: 40,     // Contexto
            reminderEnd: 85         // Final del prompt
        };
    }

    /**
     * Optimiza el contexto aplicando "Serial Position Effect".
     * Coloca información crítica al inicio y final.
     * @param {Object} components - { systemPrompt, query, examples, rag, history, profile }
     * @returns {Object} - { optimizedPrompt, usage }
     */
    optimizeContext(components) {
        const sections = [];
        let usedTokens = 0;

        // 1. Inicio: Instrucciones críticas (siempre primero)
        if (components.criticalInstructions) {
            const tokens = this._estimateTokens(components.criticalInstructions);
            if (usedTokens + tokens <= this.availableTokens) {
                sections.push({
                    position: 'start',
                    priority: this.priorities.criticalInstructions,
                    content: components.criticalInstructions,
                    tokens
                });
                usedTokens += tokens;
            }
        }

        // 2. Sistema
        if (components.systemPrompt) {
            const tokens = this._estimateTokens(components.systemPrompt);
            if (usedTokens + tokens <= this.availableTokens) {
                sections.push({
                    position: 'start',
                    priority: this.priorities.systemPrompt,
                    content: components.systemPrompt,
                    tokens
                });
                usedTokens += tokens;
            }
        }

        // 3. Query actual (siempre incluir)
        if (components.currentQuery) {
            const tokens = this._estimateTokens(components.currentQuery);
            sections.push({
                position: 'middle',
                priority: this.priorities.currentQuery,
                content: components.currentQuery,
                tokens
            });
            usedTokens += tokens;
        }

        // 4. Componentes opcionales ordenados por prioridad
        const optionalComponents = [
            { key: 'fewShotExamples', priority: this.priorities.fewShotExamples },
            { key: 'ragContext', priority: this.priorities.ragContext },
            { key: 'studentProfile', priority: this.priorities.studentProfile },
            { key: 'sessionHistory', priority: this.priorities.sessionHistory }
        ].sort((a, b) => b.priority - a.priority);

        for (const comp of optionalComponents) {
            if (components[comp.key]) {
                const content = this._truncateIfNeeded(components[comp.key], this.availableTokens - usedTokens);
                if (content) {
                    const tokens = this._estimateTokens(content);
                    if (usedTokens + tokens <= this.availableTokens) {
                        sections.push({
                            position: 'middle',
                            priority: comp.priority,
                            content,
                            tokens
                        });
                        usedTokens += tokens;
                    }
                }
            }
        }

        // 5. Final: Recordatorio (Serial Position Effect - recency)
        if (components.reminderEnd) {
            const tokens = this._estimateTokens(components.reminderEnd);
            if (usedTokens + tokens <= this.availableTokens) {
                sections.push({
                    position: 'end',
                    priority: this.priorities.reminderEnd,
                    content: components.reminderEnd,
                    tokens
                });
                usedTokens += tokens;
            }
        }

        // Ordenar y ensamblar
        const startSections = sections.filter(s => s.position === 'start').sort((a, b) => b.priority - a.priority);
        const middleSections = sections.filter(s => s.position === 'middle').sort((a, b) => b.priority - a.priority);
        const endSections = sections.filter(s => s.position === 'end');

        const optimizedPrompt = [
            ...startSections.map(s => s.content),
            ...middleSections.map(s => s.content),
            ...endSections.map(s => s.content)
        ].join('\n\n---\n\n');

        return {
            optimizedPrompt,
            usage: {
                usedTokens,
                availableTokens: this.availableTokens,
                utilization: Math.round((usedTokens / this.availableTokens) * 100) + '%',
                includedSections: sections.map(s => ({ priority: s.priority, tokens: s.tokens }))
            }
        };
    }

    /**
     * Sumariza historia si es muy larga.
     * @param {Array} history - Array de interacciones
     * @param {number} maxItems 
     * @returns {string}
     */
    summarizeHistory(history, maxItems = 5) {
        if (!history || history.length === 0) return '';

        // Mantener las más recientes
        const recent = history.slice(-maxItems);

        return recent.map(h => {
            if (h.type === 'LESSON_GENERATED') {
                return `- Lección sobre: "${h.topic}"`;
            }
            if (h.type === 'QUIZ_ANSWERED') {
                return `- Quiz: ${h.correct ? '✓' : '✗'} ${h.topic}`;
            }
            return `- ${h.type}`;
        }).join('\n');
    }

    /**
     * Estima tokens (aproximación: 1 token ≈ 4 caracteres).
     */
    _estimateTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Trunca contenido si excede el límite de tokens.
     */
    _truncateIfNeeded(content, maxTokens) {
        const currentTokens = this._estimateTokens(content);
        if (currentTokens <= maxTokens) return content;

        const maxChars = maxTokens * 4;
        return content.substring(0, maxChars) + '... [truncado]';
    }
}

// Exportar singleton con configuración por defecto
const contextWindowManager = new ContextWindowManager({
    maxTokens: 8000,
    reserveForOutput: 2000
});

module.exports = { contextWindowManager, ContextWindowManager };
