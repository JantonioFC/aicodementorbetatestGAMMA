/**
 * User Entity Memory
 * Almacena y recupera información sobre el perfil del estudiante.
 * Basado en skill: conversation-memory
 */
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface UserEntity {
    id: string;
    userId: string;
    type: string;
    key: string;
    value: unknown;
    confidence: number;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MemoryStats {
    decayed: number;
    removed: number;
    total: number;
}

export interface UserCognitiveProfile {
    preferences: Record<string, { value: unknown; confidence: number }>;
    masteredSkills: string[];
    strugglingWith: string[];
    interests: string[];
}

export class UserEntityMemory {
    constructor() {
        this._ensureTable();
    }

    private _ensureTable(): void {
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_entities (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_key TEXT NOT NULL,
                entity_value TEXT NOT NULL,
                confidence REAL DEFAULT 1.0,
                source TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, entity_type, entity_key)
            );
            CREATE INDEX IF NOT EXISTS idx_user_entities_user ON user_entities(user_id);
        `);
    }

    /**
     * Guarda o actualiza una entidad del usuario.
     */
    set(userId: string, entityType: string, key: string, value: unknown, options: { confidence?: number; source?: string } = {}): string {
        const id = uuidv4();
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        db.run(`
            INSERT INTO user_entities (id, user_id, entity_type, entity_key, entity_value, confidence, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, entity_type, entity_key) DO UPDATE SET
                entity_value = excluded.entity_value,
                confidence = excluded.confidence,
                updated_at = CURRENT_TIMESTAMP
        `, [
            id,
            userId,
            entityType,
            key,
            serializedValue,
            options.confidence ?? 1.0,
            options.source || 'system'
        ]);

        return id;
    }

    /**
     * Obtiene una entidad específica.
     */
    get(userId: string, entityType: string, key: string): unknown | null {
        const row = db.get<{ entity_value: string }>(
            'SELECT entity_value FROM user_entities WHERE user_id = ? AND entity_type = ? AND entity_key = ?',
            [userId, entityType, key]
        );

        if (!row) return null;

        try {
            return JSON.parse(row.entity_value);
        } catch {
            return row.entity_value;
        }
    }

    /**
     * Obtiene todas las entidades de un tipo para un usuario.
     */
    getAll(userId: string, entityType: string): Record<string, { value: unknown, confidence: number }> {
        const rows = db.query<{ entity_key: string, entity_value: string, confidence: number }>(
            'SELECT entity_key, entity_value, confidence FROM user_entities WHERE user_id = ? AND entity_type = ?',
            [userId, entityType]
        );

        const result: Record<string, { value: unknown, confidence: number }> = {};
        for (const row of rows) {
            try {
                result[row.entity_key] = {
                    value: JSON.parse(row.entity_value),
                    confidence: row.confidence
                };
            } catch {
                result[row.entity_key] = {
                    value: row.entity_value,
                    confidence: row.confidence
                };
            }
        }
        return result;
    }

    /**
     * Construye el perfil completo del usuario para inyección en prompt.
     */
    getProfile(userId: string): UserCognitiveProfile {
        const preferences = this.getAll(userId, 'preference');
        const skills = this.getAll(userId, 'skill');
        const struggles = this.getAll(userId, 'struggle');
        const interests = this.getAll(userId, 'interest');

        return {
            preferences,
            masteredSkills: Object.entries(skills)
                .filter(([_, v]) => v.confidence >= 0.8)
                .map(([k]) => k),
            strugglingWith: Object.entries(struggles)
                .filter(([_, v]) => v.confidence >= 0.5)
                .map(([k]) => k),
            interests: Object.keys(interests)
        };
    }

    /**
     * Construye contexto de texto para inyectar en prompt.
     */
    buildPromptContext(userId: string): string {
        const profile = this.getProfile(userId);
        const parts: string[] = [];

        if (profile.preferences.learningStyle) {
            parts.push(`Estilo de aprendizaje preferido: ${String(profile.preferences.learningStyle.value)}`);
        }

        if (profile.masteredSkills.length > 0) {
            parts.push(`Temas dominados: ${profile.masteredSkills.join(', ')}`);
        }

        if (profile.strugglingWith.length > 0) {
            parts.push(`Áreas que necesitan refuerzo: ${profile.strugglingWith.join(', ')}`);
        }

        if (profile.interests.length > 0) {
            parts.push(`Intereses del estudiante: ${profile.interests.join(', ')}`);
        }

        if (parts.length === 0) {
            return '';
        }

        return `\n**Perfil del Estudiante:**\n${parts.join('\n')}`;
    }

    /**
     * Actualiza el perfil basado en interacción de quiz.
     */
    updateFromQuiz(userId: string, topic: string, correct: boolean, _difficulty: number = 1): void {
        const entityType = correct ? 'skill' : 'struggle';

        // Obtener historial de confianza para este tema
        const entity = db.get<{ confidence: number }>(
            'SELECT confidence FROM user_entities WHERE user_id = ? AND entity_type = ? AND entity_key = ?',
            [userId, entityType, topic]
        );

        let newConfidence: number;
        if (!entity) {
            newConfidence = correct ? 0.6 : 0.4;
        } else {
            const delta = correct ? 0.1 : -0.1;
            newConfidence = Math.max(0, Math.min(1, entity.confidence + delta));
        }

        this.set(userId, entityType, topic, true, {
            confidence: newConfidence,
            source: 'quiz'
        });
    }

    /**
     * Aplica decay a entidades no usadas recientemente.
     */
    applyDecay(userId: string, decayRate: number = 0.1, daysThreshold: number = 7): MemoryStats {
        const staleEntities = db.query<{ id: string, entity_key: string, entity_type: string, confidence: number }>(`
            SELECT id, entity_key, entity_type, confidence 
            FROM user_entities 
            WHERE user_id = ? 
            AND updated_at < datetime('now', '-${daysThreshold} days')
            AND confidence > 0.1
        `, [userId]);

        let decayed = 0;
        let removed = 0;

        for (const entity of staleEntities) {
            const newConfidence = entity.confidence - decayRate;

            if (newConfidence <= 0.1) {
                db.run('DELETE FROM user_entities WHERE id = ?', [entity.id]);
                removed++;
            } else {
                db.run(`
                    UPDATE user_entities 
                    SET confidence = ?, updated_at = datetime('now')
                    WHERE id = ?
                `, [newConfidence, entity.id]);
                decayed++;
            }
        }

        return { decayed, removed, total: staleEntities.length };
    }

    /**
     * Limpia entidades con confianza muy baja.
     */
    cleanup(userId: string, threshold: number = 0.2): number {
        const result = db.run(`
            DELETE FROM user_entities 
            WHERE user_id = ? AND confidence < ?
        `, [userId, threshold]);

        return result.changes || 0;
    }
}

// Exportar singleton
export const userEntityMemory = new UserEntityMemory();
