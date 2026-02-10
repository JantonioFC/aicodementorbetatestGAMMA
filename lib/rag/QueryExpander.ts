
import { geminiRouter } from '../ai/router/GeminiRouter';
import { cacheService } from '../cache/CacheService';
import { logger } from '../utils/logger';

interface ExpansionOptions {
    useLLM: boolean;
}

interface LLMExpansionResponse {
    expansions: string[];
}

export class QueryExpander {
    private synonyms: Record<string, string[]>;

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
     */
    expandWithSynonyms(query: string): string[] {
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
     */
    async expandWithLLM(query: string, numExpansions: number = 3): Promise<string[]> {
        // Verificar cache
        const cacheKey = `query_expansion:${query}`;
        const cached = await cacheService.get<string[]>(cacheKey);
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
                code: '',
                language: 'es',
                phase: 'rag-expansion',
                analysisType: 'expansion',
                systemPrompt: 'You are a query expansion assistant. Respond with JSON.',
                messages: [{ role: 'user', content: prompt }]
            });

            // Asumimos que la respuesta viene en 'analysis' y es un objeto o string JSON
            const parsed = response.analysis;
            const expansions = this._parseExpansions(parsed, query);

            // Guardar en cache (1 hora)
            cacheService.set(cacheKey, expansions, 3600);

            return expansions;

        } catch (error: any) {
            logger.error(`[QueryExpander] Error LLM: ${error.message}`);
            return [query];
        }
    }

    /**
     * Expansión híbrida: sinónimos locales + LLM.
     */
    async expand(query: string, options: ExpansionOptions = { useLLM: true }): Promise<string[]> {
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
    private _parseExpansions(response: any, originalQuery: string): string[] {
        try {
            let parsed: any;
            if (typeof response === 'string') {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } else {
                parsed = response;
            }

            if (parsed?.expansions && Array.isArray(parsed.expansions)) {
                return [originalQuery, ...parsed.expansions];
            }

            // Si es un objeto AnalysisAnalysis con feedback, intentar extraer de ahí si el prompt falló en dar JSON puro
            if (response?.feedback) {
                // Fallback simple si el modelo "conversó" en lugar de dar JSON
                return [originalQuery];
            }

            return [originalQuery];

        } catch (e: any) {
            logger.error(`[QueryExpander] Error parsing: ${e.message}`);
            return [originalQuery];
        }
    }

    /**
     * Agrega sinónimos personalizados al diccionario.
     */
    addSynonyms(term: string, synonyms: string[]): void {
        const existing = this.synonyms[term.toLowerCase()] || [];
        this.synonyms[term.toLowerCase()] = [...new Set([...existing, ...synonyms])];
    }
}

// Exportar singleton
export const queryExpander = new QueryExpander();
