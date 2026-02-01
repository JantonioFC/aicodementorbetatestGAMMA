/**
 * Persistent Cache Service
 * Cache persistente usando SQLite separado.
 * Archivo: data/cache.db (ignorado por .gitignore)
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class CacheService {
    constructor() {
        this.db = null;
        this.memoryFallback = new Map();
        this._init();
    }

    _init() {
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

        } catch (error) {
            console.warn('⚠️ [CacheService] No se pudo inicializar SQLite, usando memoria:', error.message);
            this.db = null;
        }
    }

    /**
     * Obtiene un valor del cache.
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        if (!this.db) {
            const cached = this.memoryFallback.get(key);
            if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
                return cached.value;
            }
            return null;
        }

        try {
            const row = this._stmtGet.get(key);
            if (!row) return null;

            // Verificar expiración
            if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
                this._stmtDel.run(key);
                return null;
            }

            return JSON.parse(row.value);
        } catch (error) {
            console.error('[CacheService] Error get:', error.message);
            return null;
        }
    }

    /**
     * Guarda un valor en cache.
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds - Tiempo de vida en segundos (default: 1 hora)
     */
    set(key, value, ttlSeconds = 3600) {
        if (!this.db) {
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
        } catch (error) {
            console.error('[CacheService] Error set:', error.message);
        }
    }

    /**
     * Elimina una entrada del cache.
     * @param {string} key 
     */
    delete(key) {
        if (!this.db) {
            this.memoryFallback.delete(key);
            return;
        }

        try {
            this._stmtDel.run(key);
        } catch (error) {
            console.error('[CacheService] Error delete:', error.message);
        }
    }

    /**
     * Obtiene o calcula un valor (pattern: cache-aside).
     * @param {string} key 
     * @param {Function} factory - Función que genera el valor si no está en cache
     * @param {number} ttlSeconds 
     * @returns {any}
     */
    async getOrSet(key, factory, ttlSeconds = 3600) {
        const cached = this.get(key);
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
    _cleanup() {
        if (!this.db) return;

        try {
            const now = Math.floor(Date.now() / 1000);
            const result = this._stmtCleanup.run(now);
            if (result.changes > 0) {
                console.log(`🧹 [CacheService] Limpiadas ${result.changes} entradas expiradas`);
            }
        } catch (error) {
            console.error('[CacheService] Error cleanup:', error.message);
        }
    }

    /**
     * Obtiene estadísticas del cache.
     * @returns {Object}
     */
    getStats() {
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
            `).get();

            return {
                type: 'sqlite',
                path: 'data/cache.db',
                entries: stats.total,
                expired: stats.expired,
                sizeKB: Math.round(stats.totalBytes / 1024)
            };
        } catch (error) {
            return { type: 'sqlite', error: error.message };
        }
    }

    /**
     * Limpia todo el cache.
     */
    clear() {
        if (!this.db) {
            this.memoryFallback.clear();
            return;
        }

        try {
            this.db.exec('DELETE FROM cache');
            console.log('🗑️ [CacheService] Cache limpiado');
        } catch (error) {
            console.error('[CacheService] Error clear:', error.message);
        }
    }
}

// Exportar singleton
const cacheService = new CacheService();
module.exports = { cacheService, CacheService };
