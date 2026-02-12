
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cacheService } from '../cache/CacheService';
import { db } from '../db';
import { logger } from '../observability/Logger';

interface EmbeddingResult {
    semanaId: number;
    dia: number;
    pomodoroIndex: number;
    text: string;
    similarity: number;
}

interface IndexStats {
    indexed: number;
    skipped: number;
}

export class EmbeddingService {
    private genAI: GoogleGenerativeAI;
    private model: { embedContent(text: string): Promise<{ embedding: { values: number[] } }> };
    private dimension: number;
    private cacheEnabled: boolean;
    private cacheTTL: number;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            logger.warn('[EmbeddingService] GEMINI_API_KEY not found');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        this.dimension = 768; // Dimensión del embedding de Gemini
        this.cacheEnabled = true;
        this.cacheTTL = 3600; // 1 hora
    }

    /**
     * Genera un embedding para un texto (con cache).
     */
    async embed(text: string): Promise<number[]> {
        try {
            // Generar cache key basada en hash del texto
            const cacheKey = `embedding:${this._hashText(text)}`;

            // Intentar obtener de cache
            if (this.cacheEnabled) {
                const cached = await cacheService.get<number[]>(cacheKey);
                if (cached) {
                    return cached;
                }
            }

            // Generar embedding
            const result = await this.model.embedContent(text);
            const embedding = result.embedding.values as number[];

            // Guardar en cache
            if (this.cacheEnabled) {
                cacheService.set(cacheKey, embedding, this.cacheTTL);
            }

            return embedding;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[EmbeddingService] Error generando embedding: ${message}`);
            throw error;
        }
    }

    /**
     * Genera un hash simple del texto para cache key.
     */
    private _hashText(text: string): string {
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
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];
        for (const text of texts) {
            const emb = await this.embed(text);
            embeddings.push(emb);
        }
        return embeddings;
    }

    /**
     * Indexa todos los pomodoros del currículo.
     */
    async indexCurriculum(): Promise<IndexStats> {
        logger.info('🔄 [EmbeddingService] Iniciando indexación del currículo...');

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
        const esquemas = db.query<{ semana_id: number; dia: number; pomodoros: string; titulo_semana: string; concepto: string }>(`
            SELECT ed.semana_id, ed.dia, ed.pomodoros, s.titulo_semana, ed.concepto
            FROM esquema_diario ed
            JOIN semanas s ON ed.semana_id = s.id
        `, []);

        let indexed = 0;
        let skipped = 0;

        for (const esquema of esquemas) {
            const pomodoros: string[] = JSON.parse(esquema.pomodoros || '[]');

            for (let i = 0; i < pomodoros.length; i++) {
                // Verificar si ya está indexado
                const existing = db.get<{ '1': number }>(
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
                        logger.info(`   ✅ Indexados: ${indexed}`);
                        await this._sleep(1000); // Pausa para evitar rate limits
                    }
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    logger.error(`   ❌ Error indexando S${esquema.semana_id}/D${esquema.dia}/P${i}: ${message}`);
                }
            }
        }

        logger.info(`🏁 [EmbeddingService] Indexación completa: ${indexed} nuevos, ${skipped} existentes.`);
        return { indexed, skipped };
    }

    /**
     * Busca pomodoros similares a una query.
     */
    async searchSimilar(query: string, limit: number = 5): Promise<EmbeddingResult[]> {
        const queryEmbedding = await this.embed(query);

        // Obtener todos los embeddings (para datasets pequeños)
        const allEmbeddings = db.query<{ semana_id: number; dia: number; pomodoro_index: number; text_content: string; embedding: string }>('SELECT * FROM pomodoro_embeddings', []);

        // Calcular similitud coseno
        const results = allEmbeddings.map(row => {
            const embedding = JSON.parse(row.embedding) as number[];
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
    private _cosineSimilarity(a: number[], b: number[]): number {
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

    private _sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar singleton
export const embeddingService = new EmbeddingService();
