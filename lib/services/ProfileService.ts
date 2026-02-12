import { db } from '../db';
import { logger } from '../observability/Logger';

export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    bio?: string;
    learning_goals?: string;
    preferences?: string;
    created_at: string;
    updated_at: string;
}

export interface ProgressStats {
    quiz: {
        total: number;
        correct: number;
        accuracy: number;
    };
    progress: {
        lessonsCompleted: number;
        exercisesCompleted: number;
        totalActivities: number;
    };
    streak: number;
    lastActivity: string | null;
    joinedDate: string | null;
}

export class ProfileService {
    /**
     * Obtener perfil completo de usuario
     */
    async getProfile(userId: string, email: string): Promise<UserProfile & { authData: unknown; stats: ProgressStats }> {
        try {
            let profile = db.findOne<UserProfile>('user_profiles', { id: userId });

            if (!profile) {
                logger.info(`[ProfileService] Creando perfil inicial para ${email}...`, { email });
                profile = this.createInitialProfile(userId, email);
            }

            const stats = await this.getProgressStats(userId);

            return {
                ...profile,
                authData: {
                    email: email,
                    emailVerified: true,
                    lastSignIn: new Date().toISOString(),
                    createdAt: profile.created_at
                },
                stats
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[ProfileService] Error obteniendo perfil: ${message}`);
            throw error;
        }
    }

    /**
     * Crear perfil inicial
     */
    createInitialProfile(userId: string, email: string): UserProfile {
        const newProfile: UserProfile = {
            id: userId,
            email: email,
            display_name: email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.insert('user_profiles', newProfile as unknown as Record<string, import('../db').QueryParams>);
        return newProfile;
    }

    /**
     * Actualizar perfil
     */
    async updateProfile(userId: string, updates: Record<string, unknown>): Promise<UserProfile | undefined> {
        try {
            const allowedFields = ['display_name', 'bio', 'learning_goals', 'preferences'];
            const cleanUpdates: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    cleanUpdates[key] = typeof value === 'object' ? JSON.stringify(value) : value;
                }
            }

            cleanUpdates.updated_at = new Date().toISOString();

            db.update('user_profiles', cleanUpdates as Record<string, import('../db').QueryParams>, { id: userId } as Record<string, import('../db').QueryParams>);
            return db.findOne<UserProfile>('user_profiles', { id: userId });

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[ProfileService] Error actualizando perfil: ${message}`);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de progreso
     */
    async getProgressStats(userId: string): Promise<ProgressStats> {
        try {
            const quizStats = db.get<{ total: number; correct: number }>(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                FROM quiz_attempts
                WHERE user_id = ?
            `, [userId]);

            const lessonsResult = db.get<{ count: number }>(`
                SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = ? AND completed = 1
            `, [userId]);
            const lessonsCount = lessonsResult?.count || 0;

            const exercisesResult = db.get<{ count: number }>(`
                SELECT COUNT(*) as count FROM user_exercise_progress WHERE user_id = ? AND completed = 1
            `, [userId]);
            const exercisesCount = exercisesResult?.count || 0;

            const totalQuiz = quizStats?.total || 0;
            const correctQuiz = quizStats?.correct || 0;

            return {
                quiz: {
                    total: totalQuiz,
                    correct: correctQuiz,
                    accuracy: totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0
                },
                progress: {
                    lessonsCompleted: lessonsCount,
                    exercisesCompleted: exercisesCount,
                    totalActivities: totalQuiz + lessonsCount + exercisesCount
                },
                streak: 0,
                lastActivity: new Date().toISOString(),
                joinedDate: new Date().toISOString()
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[ProfileService] Error calculando estadísticas: ${message}`);
            return {
                quiz: { total: 0, correct: 0, accuracy: 0 },
                progress: { lessonsCompleted: 0, exercisesCompleted: 0, totalActivities: 0 },
                streak: 0,
                lastActivity: null,
                joinedDate: null
            };
        }
    }

    /**
     * Eliminar usuario permanentemente (GDPR)
     */
    deleteUser(userId: string): boolean {
        try {
            logger.warn(`[ProfileService] Eliminando usuario ${userId} (GDPR Request)`);

            db.transaction(() => {
                db.run('DELETE FROM user_profiles WHERE id = ?', [userId]);
                try {
                    db.run('DELETE FROM users WHERE id = ?', [userId]);
                } catch (e: unknown) { }
            });

            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[ProfileService] Error eliminando usuario: ${message}`);
            throw error;
        }
    }
}

export const profileService = new ProfileService();
