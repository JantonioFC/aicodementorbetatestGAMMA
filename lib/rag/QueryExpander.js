/**
 * Query Expander - Expande consultas con sinónimos y reformulaciones
 * Mejora el recall del RAG buscando con variaciones de la query.
 */
const geminiRouter = require('../ai/router/GeminiRouter');
const { cacheService } = require('../cache/CacheService');

class QueryExpander {
    constructor() {
        // Sinónimos comunes para el dominio educativo
        this.synonyms = {
            'algoritmo': ['procedimiento', 'pasos', 'secuencia', 'instrucciones'],
            'condicional': ['if', 'decisión', 'selección', 'condición'],
            'repetición': ['loop', 'bucle', 'ciclo', 'iteración'],
            'variable': ['dato', 'valor', 'contenedor', 'almacén'],
            'función': ['procedimiento', 'rutina', 'bloque', 'módulo'],
            'scratch': ['bloques', 'visual', 'arrastrar'],
            'pensamiento computacional': ['lógica', 'resolución de problemas', 'abstracción']
        };
    }

    /**
     * Expande una query con sinónimos locales.
     * @param {string} query 
     * @returns {Array<string>} Array de queries expandidas
     */
    expandWithSynonyms(query) {
        const queries = [query];
        const lowerQuery = query.toLowerCase();

        for (const [term, synonyms] of Object.entries(this.synonyms)) {
            if (lowerQuery.includes(term)) {
                for (const syn of synonyms) {
                    queries.push(query.replace(new RegExp(term, 'gi'), syn));
                }
            }
        }

        return [...new Set(queries)]; // Eliminar duplicados
    }

    /**
     * Expande query usando LLM para generar reformulaciones.
     * @param {string} query 
     * @param {number} numExpansions 
     * @returns {Promise<Array<string>>}
     */
    async expandWithLLM(query, numExpansions = 3) {
        // Verificar cache
        const cacheKey = `query_expansion:${query}`;
        const cached = cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = `Genera ${numExpansions} reformulaciones de esta consulta para búsqueda semántica.
Contexto: Plataforma educativa de programación para niños (Scratch, pensamiento computacional).

**CONSULTA ORIGINAL:** "${query}"

**INSTRUCCIONES:**
- Genera variaciones que capturen la misma intención
- Incluye sinónimos y formas alternativas de preguntar
- Responde SOLO con JSON: { "expansions": ["query1", "query2", "query3"] }

**RESPUESTA:**`;

            const response = await geminiRouter.analyze({
                prompt,
                responseType: 'json',
                temperature: 0.7
            });

            const expansions = this._parseExpansions(response, query);

            // Guardar en cache (1 hora)
            cacheService.set(cacheKey, expansions, 3600);

            return expansions;

        } catch (error) {
            console.error('[QueryExpander] Error LLM:', error.message);
            return [query];
        }
    }

    /**
     * Expansión híbrida: sinónimos locales + LLM.
     * @param {string} query 
     * @param {Object} options 
     * @returns {Promise<Array<string>>}
     */
    async expand(query, options = { useLLM: true }) {
        const localExpansions = this.expandWithSynonyms(query);

        if (options.useLLM) {
            const llmExpansions = await this.expandWithLLM(query);
            return [...new Set([...localExpansions, ...llmExpansions])];
        }

        return localExpansions;
    }

    /**
     * Parsea la respuesta del LLM.
     */
    _parseExpansions(response, originalQuery) {
        try {
            let parsed;
            if (typeof response === 'string') {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } else {
                parsed = response;
            }

            if (parsed?.expansions && Array.isArray(parsed.expansions)) {
                return [originalQuery, ...parsed.expansions];
            }

            return [originalQuery];

        } catch (e) {
            console.error('[QueryExpander] Error parsing:', e.message);
            return [originalQuery];
        }
    }

    /**
     * Agrega sinónimos personalizados al diccionario.
     * @param {string} term 
     * @param {Array<string>} synonyms 
     */
    addSynonyms(term, synonyms) {
        const existing = this.synonyms[term.toLowerCase()] || [];
        this.synonyms[term.toLowerCase()] = [...new Set([...existing, ...synonyms])];
    }
}

// Exportar singleton
const queryExpander = new QueryExpander();
module.exports = { queryExpander, QueryExpander };
