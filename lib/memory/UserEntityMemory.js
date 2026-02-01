/**
 * User Entity Memory
 * Almacena y recupera información sobre el perfil del estudiante.
 * Basado en skill: conversation-memory
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class UserEntityMemory {
    constructor() {
        this._ensureTable();
    }

    _ensureTable() {
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
     * @param {string} userId 
     * @param {string} entityType - 'preference', 'skill', 'struggle', 'interest'
     * @param {string} key 
     * @param {any} value 
     * @param {Object} options - { confidence, source }
     */
    set(userId, entityType, key, value, options = {}) {
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
            options.confidence || 1.0,
            options.source || 'system'
        ]);

        return id;
    }

    /**
     * Obtiene una entidad específica.
     * @param {string} userId 
     * @param {string} entityType 
     * @param {string} key 
     * @returns {any|null}
     */
    get(userId, entityType, key) {
        const row = db.get(
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
     * @param {string} userId 
     * @param {string} entityType 
     * @returns {Object}
     */
    getAll(userId, entityType) {
        const rows = db.query(
            'SELECT entity_key, entity_value, confidence FROM user_entities WHERE user_id = ? AND entity_type = ?',
            [userId, entityType]
        );

        const result = {};
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
     * @param {string} userId 
     * @returns {Object}
     */
    getProfile(userId) {
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
     * @param {string} userId 
     * @returns {string}
     */
    buildPromptContext(userId) {
        const profile = this.getProfile(userId);

        const parts = [];

        if (profile.preferences.learningStyle) {
            parts.push(`Estilo de aprendizaje preferido: ${profile.preferences.learningStyle.value}`);
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
     * @param {string} userId 
     * @param {string} topic 
     * @param {boolean} correct 
     * @param {number} difficulty 
     */
    updateFromQuiz(userId, topic, correct, difficulty = 1) {
        const entityType = correct ? 'skill' : 'struggle';
        const current = this.get(userId, entityType, topic);

        // Ajustar confianza basado en resultado
        let newConfidence;
        if (current === null) {
            newConfidence = correct ? 0.6 : 0.4;
        } else {
            const delta = correct ? 0.1 : -0.1;
            newConfidence = Math.max(0, Math.min(1, current.confidence + delta));
        }

        this.set(userId, entityType, topic, true, {
            confidence: newConfidence,
            source: 'quiz'
        });
    }

    /**
     * Aplica decay a entidades no usadas recientemente.
     * Reduce la confianza de memorias viejas para mantener relevancia.
     * @param {string} userId 
     * @param {number} decayRate - Tasa de decay (0-1, default 0.1)
     * @param {number} daysThreshold - Días sin uso para aplicar decay (default 7)
     * @returns {Object} { decayed, removed }
     */
    applyDecay(userId, decayRate = 0.1, daysThreshold = 7) {
        // Encontrar entidades que no se han actualizado recientemente
        const staleEntities = db.query(`
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
                // Eliminar entidades con confianza muy baja
                db.run('DELETE FROM user_entities WHERE id = ?', [entity.id]);
                removed++;
            } else {
                // Reducir confianza
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
     * @param {string} userId 
     * @param {number} threshold - Confianza mínima (default 0.2)
     * @returns {number} Número de entidades eliminadas
     */
    cleanup(userId, threshold = 0.2) {
        const result = db.run(`
            DELETE FROM user_entities 
            WHERE user_id = ? AND confidence < ?
        `, [userId, threshold]);

        return result.changes || 0;
    }
}

// Exportar singleton
const userEntityMemory = new UserEntityMemory();
module.exports = { userEntityMemory, UserEntityMemory };

