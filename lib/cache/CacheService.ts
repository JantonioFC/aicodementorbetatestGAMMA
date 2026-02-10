
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

interface CacheEntry {
    value: any;
    expiresAt: number | null;
}

interface CacheStats {
    type: 'memory' | 'sqlite';
    path?: string;
    entries: number;
    expired?: number;
    sizeKB?: number;
    error?: string;
}

export class CacheService {
    private db: Database.Database | null = null;
    private memoryFallback: Map<string, CacheEntry>;
    private _stmtGet: Database.Statement | null = null;
    private _stmtSet: Database.Statement | null = null;
    private _stmtDel: Database.Statement | null = null;
    private _stmtCleanup: Database.Statement | null = null;

    constructor() {
        this.memoryFallback = new Map();
        this._init();
    }

    private _init(): void {
        try {
            // Crear directorio si no existe
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Usar archivo separado para cache (ignorado por git)
            const cachePath = path.join(dataDir, 'cache.db');
            this.db = new Database(cachePath);

            // Crear tabla de cache
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expires_at INTEGER,
                    created_at INTEGER DEFAULT (strftime('%s', 'now'))
                );
                CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
            `);

            // Preparar statements
            this._stmtGet = this.db.prepare('SELECT value, expires_at FROM cache WHERE key = ?');
            this._stmtSet = this.db.prepare(`
                INSERT OR REPLACE INTO cache (key, value, expires_at) 
                VALUES (?, ?, ?)
            `);
            this._stmtDel = this.db.prepare('DELETE FROM cache WHERE key = ?');
            this._stmtCleanup = this.db.prepare('DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?');

            console.log('✅ [CacheService] Cache SQLite inicializado en data/cache.db');

            // Limpiar entradas expiradas al iniciar
            this._cleanup();

        } catch (error: any) {
            console.warn('⚠️ [CacheService] No se pudo inicializar SQLite, usando memoria:', error.message);
            this.db = null;
        }
    }

    /**
     * Obtiene un valor del cache.
     */
    get<T = any>(key: string): T | null {
        if (!this.db || !this._stmtGet) {
            const cached = this.memoryFallback.get(key);
            if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
                return cached.value as T;
            }
            return null;
        }

        try {
            const row = this._stmtGet.get(key) as { value: string, expires_at: number } | undefined;
            if (!row) return null;

            // Verificar expiración
            if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
                if (this._stmtDel) this._stmtDel.run(key);
                return null;
            }

            return JSON.parse(row.value) as T;
        } catch (error: any) {
            console.error('[CacheService] Error get:', error.message);
            return null;
        }
    }

    /**
     * Guarda un valor en cache.
     * @param ttlSeconds - Tiempo de vida en segundos (default: 1 hora)
     */
    set(key: string, value: any, ttlSeconds: number = 3600): void {
        if (!this.db || !this._stmtSet) {
            this.memoryFallback.set(key, {
                value,
                expiresAt: Date.now() + (ttlSeconds * 1000)
            });
            return;
        }

        try {
            const expiresAt = ttlSeconds > 0
                ? Math.floor(Date.now() / 1000) + ttlSeconds
                : null;

            this._stmtSet.run(key, JSON.stringify(value), expiresAt);
        } catch (error: any) {
            console.error('[CacheService] Error set:', error.message);
        }
    }

    /**
     * Elimina una entrada del cache.
     */
    delete(key: string): void {
        if (!this.db || !this._stmtDel) {
            this.memoryFallback.delete(key);
            return;
        }

        try {
            this._stmtDel.run(key);
        } catch (error: any) {
            console.error('[CacheService] Error delete:', error.message);
        }
    }

    /**
     * Obtiene o calcula un valor (pattern: cache-aside).
     */
    async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Limpia entradas expiradas.
     */
    private _cleanup(): void {
        if (!this.db || !this._stmtCleanup) return;

        try {
            const now = Math.floor(Date.now() / 1000);
            const result = this._stmtCleanup.run(now);
            if (result.changes > 0) {
                console.log(`🧹 [CacheService] Limpiadas ${result.changes} entradas expiradas`);
            }
        } catch (error: any) {
            console.error('[CacheService] Error cleanup:', error.message);
        }
    }

    /**
     * Obtiene estadísticas del cache.
     */
    getStats(): CacheStats {
        if (!this.db) {
            return {
                type: 'memory',
                entries: this.memoryFallback.size
            };
        }

        try {
            const stats = this.db.prepare(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < strftime('%s', 'now') THEN 1 ELSE 0 END) as expired,
                    SUM(length(value)) as totalBytes
                FROM cache
            `).get() as { total: number, expired: number, totalBytes: number };

            return {
                type: 'sqlite',
                path: 'data/cache.db',
                entries: stats.total,
                expired: stats.expired,
                sizeKB: Math.round(stats.totalBytes / 1024)
            };
        } catch (error: any) {
            return { type: 'sqlite', entries: 0, error: error.message };
        }
    }

    /**
     * Limpia todo el cache.
     */
    clear(): void {
        if (!this.db) {
            this.memoryFallback.clear();
            return;
        }

        try {
            this.db.exec('DELETE FROM cache');
            console.log('🗑️ [CacheService] Cache limpiado');
        } catch (error: any) {
            console.error('[CacheService] Error clear:', error.message);
        }
    }
}

// Exportar singleton
export const cacheService = new CacheService();
