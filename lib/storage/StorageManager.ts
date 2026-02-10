/**
 * Storage Manager - Persistencia Local con IndexedDB
 * Almacena historial de análisis y borradores auto-guardados.
 */

const DB_NAME = 'ai-code-mentor';
const DB_VERSION = 1;

export enum StorageStores {
    ANALYSES = 'analyses',
    DRAFTS = 'drafts',
    PREFERENCES = 'preferences'
}

export class StorageManager {
    private db: IDBDatabase | null = null;
    private isInitialized: boolean = false;

    /**
     * Inicializar IndexedDB
     */
    async init(): Promise<void> {
        if (this.isInitialized) return;

        // Solo ejecutar en cliente
        if (typeof window === 'undefined') {
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(StorageStores.ANALYSES)) {
                    const analysisStore = db.createObjectStore(StorageStores.ANALYSES, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    analysisStore.createIndex('timestamp', 'timestamp', { unique: false });
                    analysisStore.createIndex('language', 'language', { unique: false });
                }

                if (!db.objectStoreNames.contains(StorageStores.DRAFTS)) {
                    db.createObjectStore(StorageStores.DRAFTS, {
                        keyPath: 'id'
                    });
                }

                if (!db.objectStoreNames.contains(StorageStores.PREFERENCES)) {
                    db.createObjectStore(StorageStores.PREFERENCES, {
                        keyPath: 'key'
                    });
                }
            };
        });
    }

    isReady(): boolean {
        return this.isInitialized && this.db !== null;
    }

    async saveAnalysis(data: any): Promise<number> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('DB not initialized');

        const analysis = {
            timestamp: new Date().toISOString(),
            code: data.code,
            codePreview: data.code?.substring(0, 200) || '',
            language: data.language || 'javascript',
            phase: data.phase || 'fase-1',
            result: data.result,
            model: data.model || 'unknown',
            latency: data.latency || 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.ANALYSES], 'readwrite');
            const store = transaction.objectStore(StorageStores.ANALYSES);
            const request = store.add(analysis);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getAnalysisHistory(limit = 50): Promise<any[]> {
        await this.ensureInitialized();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.ANALYSES], 'readonly');
            const store = transaction.objectStore(StorageStores.ANALYSES);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');

            const results: any[] = [];
            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveDraft(code: string, language = 'javascript'): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) return;

        const draft = {
            id: 'current',
            code,
            language,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.DRAFTS], 'readwrite');
            const store = transaction.objectStore(StorageStores.DRAFTS);
            const request = store.put(draft);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getDraft(): Promise<any> {
        await this.ensureInitialized();
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.DRAFTS], 'readonly');
            const store = transaction.objectStore(StorageStores.DRAFTS);
            const request = store.get('current');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async setPreference(key: string, value: any): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.PREFERENCES], 'readwrite');
            const store = transaction.objectStore(StorageStores.PREFERENCES);
            const request = store.put({ key, value, updatedAt: new Date().toISOString() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPreference(key: string, defaultValue: any = null): Promise<any> {
        await this.ensureInitialized();
        if (!this.db) return defaultValue;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([StorageStores.PREFERENCES], 'readonly');
            const store = transaction.objectStore(StorageStores.PREFERENCES);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value ?? defaultValue);
            request.onerror = () => reject(request.error);
        });
    }

    async exportAll(): Promise<any> {
        await this.ensureInitialized();
        const analyses = await this.getAnalysisHistory(1000);
        const draft = await this.getDraft();
        return {
            analyses,
            draft,
            exportedAt: new Date().toISOString()
        };
    }

    async ensureInitialized(): Promise<void> {
        if (!this.isReady()) {
            await this.init();
        }
    }
}

export const storage = new StorageManager();
