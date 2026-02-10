/**
 * Session Repository
 * Gestiona la memoria conversacional para sesiones de aprendizaje.
 */
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface LearningSession {
    id: string;
    user_id: string;
    week_id: number | null;
    status: 'ACTIVE' | 'COMPLETED';
    created_at?: string;
    ended_at?: string;
}

export interface SessionInteraction {
    id: string;
    session_id: string;
    interaction_type: string;
    content: any;
    tokens_used: number;
    created_at?: string;
}

export class SessionRepository {
    /**
     * Obtiene o crea una sesión activa para un usuario.
     */
    getOrCreateActiveSession(userId: string, weekId: number | null = null): LearningSession {
        // Buscar sesión activa existente
        let session = db.get<LearningSession>(
            'SELECT * FROM learning_sessions WHERE user_id = ? AND status = ? LIMIT 1',
            [userId, 'ACTIVE']
        );

        if (!session) {
            // Crear nueva sesión
            const newId = uuidv4();
            db.run(
                'INSERT INTO learning_sessions (id, user_id, week_id, status) VALUES (?, ?, ?, ?)',
                [newId, userId, weekId, 'ACTIVE']
            );
            session = db.get<LearningSession>('SELECT * FROM learning_sessions WHERE id = ?', [newId])!;
        }

        return session;
    }

    /**
     * Registra una interacción en la sesión actual.
     */
    logInteraction(sessionId: string, type: string, content: any, tokensUsed: number = 0): string {
        const id = uuidv4();
        db.run(
            `INSERT INTO session_interactions (id, session_id, interaction_type, content, tokens_used) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, sessionId, type, JSON.stringify(content), tokensUsed]
        );
        return id;
    }

    /**
     * Obtiene las últimas N interacciones de una sesión para construir contexto.
     */
    getRecentInteractions(sessionId: string, limit: number = 5): SessionInteraction[] {
        const rows = db.query<any>(
            `SELECT * FROM session_interactions 
             WHERE session_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [sessionId, limit]
        );

        // Parsear JSON content
        return rows.map(row => ({
            ...row,
            content: JSON.parse(row.content || '{}')
        }));
    }

    /**
     * Construye un resumen de contexto para inyectar en el prompt de la IA.
     */
    buildContextSummary(sessionId: string): string {
        const interactions = this.getRecentInteractions(sessionId, 3);

        if (interactions.length === 0) {
            return "Esta es la primera interacción del estudiante en esta sesión.";
        }

        const summaryParts = interactions.map(i => {
            if (i.interaction_type === 'LESSON_GENERATED') {
                return `- Se generó una lección sobre: "${i.content.topic || 'tema desconocido'}"`;
            }
            if (i.interaction_type === 'QUIZ_ANSWERED') {
                const correct = i.content.is_correct ? 'correctamente' : 'incorrectamente';
                return `- El estudiante respondió ${correct} una pregunta de quiz.`;
            }
            return `- Interacción: ${i.interaction_type}`;
        });

        return `Historial reciente de la sesión:\n${summaryParts.join('\n')}`;
    }

    /**
     * Marca una sesión como completada.
     */
    endSession(sessionId: string): void {
        db.run(
            'UPDATE learning_sessions SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['COMPLETED', sessionId]
        );
    }

    /**
     * Obtiene estadísticas de la sesión.
     */
    getSessionStats(sessionId: string) {
        const lessonsCount = db.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM session_interactions 
             WHERE session_id = ? AND interaction_type = 'LESSON_GENERATED'`,
            [sessionId]
        );

        const quizzesCount = db.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM session_interactions 
             WHERE session_id = ? AND interaction_type = 'QUIZ_ANSWERED'`,
            [sessionId]
        );

        const tokensTotal = db.get<{ total: number }>(
            'SELECT SUM(tokens_used) as total FROM session_interactions WHERE session_id = ?',
            [sessionId]
        );

        return {
            lessonsGenerated: lessonsCount?.count || 0,
            quizzesAnswered: quizzesCount?.count || 0,
            totalTokensUsed: tokensTotal?.total || 0
        };
    }
}

// Exportar singleton
export const sessionRepository = new SessionRepository();
