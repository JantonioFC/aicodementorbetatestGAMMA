/**
 * Embedding Service
 * Genera y gestiona embeddings para búsqueda semántica.
 * Parte de Phase 8: Semantic Search
 * 
 * NOTA: Esta implementación usa la API de Gemini para embeddings.
 * Para una solución offline, se podría usar ONNX con sentence-transformers.
 */
const db = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { cacheService } = require('../cache/CacheService');

class EmbeddingService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        this.dimension = 768; // Dimensión del embedding de Gemini
        this.cacheEnabled = true;
        this.cacheTTL = 3600; // 1 hora
    }

    /**
     * Genera un embedding para un texto (con cache).
     * @param {string} text 
     * @returns {Promise<number[]>} Vector de embedding
     */
    async embed(text) {
        try {
            // Generar cache key basada en hash del texto
            const cacheKey = `embedding:${this._hashText(text)}`;

            // Intentar obtener de cache
            if (this.cacheEnabled) {
                const cached = await cacheService.get(cacheKey);
                if (cached) {
                    return cached;
                }
            }

            // Generar embedding
            const result = await this.model.embedContent(text);
            const embedding = result.embedding.values;

            // Guardar en cache
            if (this.cacheEnabled) {
                await cacheService.set(cacheKey, embedding, this.cacheTTL);
            }

            return embedding;
        } catch (error) {
            console.error('[EmbeddingService] Error generando embedding:', error.message);
            throw error;
        }
    }

    /**
     * Genera un hash simple del texto para cache key.
     */
    _hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Genera embeddings para múltiples textos (batch).
     * @param {string[]} texts 
     * @returns {Promise<number[][]>}
     */
    async embedBatch(texts) {
        const embeddings = [];
        for (const text of texts) {
            const emb = await this.embed(text);
            embeddings.push(emb);
        }
        return embeddings;
    }

    /**
     * Indexa todos los pomodoros del currículo.
     * Crea una tabla de embeddings si no existe.
     */
    async indexCurriculum() {
        console.log('🔄 [EmbeddingService] Iniciando indexación del currículo...');

        // Crear tabla de embeddings si no existe
        db.exec(`
            CREATE TABLE IF NOT EXISTS pomodoro_embeddings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                semana_id INTEGER NOT NULL,
                dia INTEGER NOT NULL,
                pomodoro_index INTEGER NOT NULL,
                text_content TEXT NOT NULL,
                embedding TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(semana_id, dia, pomodoro_index)
            );
            CREATE INDEX IF NOT EXISTS idx_pomodoro_embeddings_semana ON pomodoro_embeddings(semana_id);
        `);

        // Obtener todos los esquemas diarios
        const esquemas = db.query(`
            SELECT ed.semana_id, ed.dia, ed.pomodoros, s.titulo_semana, ed.concepto
            FROM esquema_diario ed
            JOIN semanas s ON ed.semana_id = s.id
        `, []);

        let indexed = 0;
        let skipped = 0;

        for (const esquema of esquemas) {
            const pomodoros = JSON.parse(esquema.pomodoros || '[]');

            for (let i = 0; i < pomodoros.length; i++) {
                // Verificar si ya está indexado
                const existing = db.get(
                    'SELECT 1 FROM pomodoro_embeddings WHERE semana_id = ? AND dia = ? AND pomodoro_index = ?',
                    [esquema.semana_id, esquema.dia, i]
                );

                if (existing) {
                    skipped++;
                    continue;
                }

                // Construir texto rico para embedding
                const textContent = [
                    esquema.titulo_semana,
                    `Día ${esquema.dia}: ${esquema.concepto}`,
                    `Pomodoro ${i + 1}: ${pomodoros[i]}`
                ].join(' | ');

                try {
                    const embedding = await this.embed(textContent);

                    db.run(`
                        INSERT INTO pomodoro_embeddings (semana_id, dia, pomodoro_index, text_content, embedding)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        esquema.semana_id,
                        esquema.dia,
                        i,
                        textContent,
                        JSON.stringify(embedding)
                    ]);

                    indexed++;

                    // Rate limiting básico
                    if (indexed % 10 === 0) {
                        console.log(`   ✅ Indexados: ${indexed}`);
                        await this._sleep(1000); // Pausa para evitar rate limits
                    }
                } catch (error) {
                    console.error(`   ❌ Error indexando S${esquema.semana_id}/D${esquema.dia}/P${i}:`, error.message);
                }
            }
        }

        console.log(`🏁 [EmbeddingService] Indexación completa: ${indexed} nuevos, ${skipped} existentes.`);
        return { indexed, skipped };
    }

    /**
     * Busca pomodoros similares a una query.
     * @param {string} query 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async searchSimilar(query, limit = 5) {
        const queryEmbedding = await this.embed(query);

        // Obtener todos los embeddings (para datasets pequeños)
        // Para datasets grandes, usar una extensión como sqlite-vss
        const allEmbeddings = db.query('SELECT * FROM pomodoro_embeddings', []);

        // Calcular similitud coseno
        const results = allEmbeddings.map(row => {
            const embedding = JSON.parse(row.embedding);
            const similarity = this._cosineSimilarity(queryEmbedding, embedding);
            return { ...row, similarity };
        });

        // Ordenar por similitud y retornar top N
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit).map(r => ({
            semanaId: r.semana_id,
            dia: r.dia,
            pomodoroIndex: r.pomodoro_index,
            text: r.text_content,
            similarity: Math.round(r.similarity * 100) / 100
        }));
    }

    /**
     * Calcula similitud coseno entre dos vectores.
     */
    _cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar singleton
const embeddingService = new EmbeddingService();
module.exports = { embeddingService, EmbeddingService };
