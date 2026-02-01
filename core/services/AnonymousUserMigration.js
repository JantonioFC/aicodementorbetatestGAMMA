// core/services/AnonymousUserMigration.js
/**
 * 🔄 SERVICIO DE MIGRACIÓN DE USUARIOS ANÓNIMOS (SQLite Version)
 * 
 * Maneja la conversión de usuarios anónimos a usuarios registrados,
 * preservando todo el progreso y datos de quiz.
 * 
 * Arquitectura: SQLite Transactional
 */

import db from '../../lib/db';

export class AnonymousUserMigrationService {
  static ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

  /**
   * 📊 Obtiene estadísticas del usuario anónimo
   * 
   * @returns {Promise<Object>} Estadísticas de progreso anónimo
   */
  static async getAnonymousStats() {
    try {
      console.log('📊 Obteniendo estadísticas de usuario anónimo...');

      const stats = {
        lessons_started: 0,
        lessons_completed: 0,
        quizzes_attempted: 0,
        exercises_completed: 0,
        has_data: false
      };

      // Consultar progreso de lecciones
      const lessonStats = db.get(`
        SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
        FROM user_lesson_progress
        WHERE user_id = ?
      `, [this.ANONYMOUS_USER_ID]);

      if (lessonStats) {
        stats.lessons_started = lessonStats.total || 0;
        stats.lessons_completed = lessonStats.completed || 0;
      }

      // Consultar intentos de quiz
      const quizStats = db.get(`
        SELECT COUNT(*) as total
        FROM quiz_attempts
        WHERE user_id = ?
      `, [this.ANONYMOUS_USER_ID]);

      if (quizStats) {
        stats.quizzes_attempted = quizStats.total || 0;
      }

      stats.has_data = (stats.lessons_started > 0) || (stats.quizzes_attempted > 0);

      console.log('✅ Estadísticas obtenidas:', stats);
      return {
        success: true,
        stats: stats,
        hasData: stats.has_data || false
      };

    } catch (error) {
      console.error('❌ Error en getAnonymousStats:', error);
      return {
        success: false,
        error: error.message,
        stats: null,
        hasData: false
      };
    }
  }

  /**
   * 🔄 Migra todos los datos del usuario anónimo al usuario registrado
   * 
   * @param {string} realUserId - UUID del usuario registrado
   * @returns {Promise<Object>} Resultado de la migración
   */
  static async migrateAnonymousData(realUserId) {
    try {
      console.log('🔄 Iniciando migración de datos anónimos...');
      console.log('📋 Usuario anónimo:', this.ANONYMOUS_USER_ID);
      console.log('📋 Usuario real:', realUserId);

      // Validar UUID del usuario real
      if (!realUserId || !this.isValidUUID(realUserId)) {
        throw new Error('UUID de usuario real inválido');
      }

      // Verificar que hay datos para migrar
      const statsResult = await this.getAnonymousStats();
      if (!statsResult.success || !statsResult.hasData) {
        console.log('ℹ️ No hay datos anónimos para migrar');
        return {
          success: true,
          migration: {
            migrated_lessons: 0,
            migrated_attempts: 0,
            message: 'No había datos para migrar'
          }
        };
      }

      let migratedLessons = 0;
      let migratedAttempts = 0;

      // PROCESO TRANSACCIONAL
      db.transaction(() => {
        // 1. Eliminar datos existentes del usuario real que puedan causar conflicto (Estrategia: El usuario nuevo prevalece o se fusiona?
        // En este MVP, asumimos que el usuario real es NUEVO, así que no tiene datos, o si tiene, borramos de anónimo los que chocan.
        // Mejor estrategia: UPDATE OR IGNORE no existe tal cual, así que haremos:
        // UPDATE tabla SET user_id = real WHERE user_id = anon
        // Pero si unique constraint falla (el real ya tenia ese lesson), entonces ignoramos el del anonimo (el real prevalece)

        // MIGRAR LECCIONES
        // Para SQLite, manejamos conflictos uno a uno o con INSERT OR IGNORE si fuera insert.
        // Al ser UPDATE, si hay conflicto de UNIQUE(user_id, lesson_id), fallará.
        // Así que primero borramos del anónimo lo que el real YA tenga.

        db.run(`
            DELETE FROM user_lesson_progress 
            WHERE user_id = ? 
            AND lesson_id IN (SELECT lesson_id FROM user_lesson_progress WHERE user_id = ?)
        `, [this.ANONYMOUS_USER_ID, realUserId]);

        const resLessons = db.run(`
            UPDATE user_lesson_progress 
            SET user_id = ? 
            WHERE user_id = ?
        `, [realUserId, this.ANONYMOUS_USER_ID]);
        migratedLessons = resLessons.changes;

        // MIGRAR EJERCICIOS
        db.run(`
            DELETE FROM user_exercise_progress 
            WHERE user_id = ? 
            AND exercise_id IN (SELECT exercise_id FROM user_exercise_progress WHERE user_id = ?)
        `, [this.ANONYMOUS_USER_ID, realUserId]);

        db.run(`
            UPDATE user_exercise_progress
            SET user_id = ?
            WHERE user_id = ?
        `, [realUserId, this.ANONYMOUS_USER_ID]);

        // MIGRAR QUIZ ATTEMPTS (No tienen unique constraint problemático usualmente, salvo ID pero son UUIDs nuevos)
        const resQuiz = db.run(`
            UPDATE quiz_attempts
            SET user_id = ?
            WHERE user_id = ?
        `, [realUserId, this.ANONYMOUS_USER_ID]);
        migratedAttempts = resQuiz.changes;

        // MIGRAR ACHIVEMENTS
        db.run(`
            UPDATE user_achievements
            SET user_id = ?
            WHERE user_id = ?
            AND achievement_id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = ?)
        `, [realUserId, this.ANONYMOUS_USER_ID, realUserId]);

        // Limpiar remanentes de anónimo si quedaron (por conflictos ignorados)
        this.clearAnonymousDataSync();

      })();

      console.log('✅ Migración completada exitosamente');

      return {
        success: true,
        migration: {
          migrated_lessons: migratedLessons,
          migrated_attempts: migratedAttempts,
          migration_timestamp: new Date().toISOString()
        },
        stats: statsResult.stats
      };

    } catch (error) {
      console.error('❌ Error en migrateAnonymousData:', error);
      return {
        success: false,
        error: error.message,
        migration: null
      };
    }
  }

  /**
   * 🎯 Proceso completo de conversión: verificar → migrar → notificar
   * 
   * @param {string} realUserId - UUID del usuario registrado
   * @returns {Promise<Object>} Resultado completo del proceso
   */
  static async convertAnonymousUser(realUserId) {
    try {
      console.log('🎯 Iniciando conversión completa de usuario anónimo...');

      // Paso 1: Obtener estadísticas previas
      const preStats = await this.getAnonymousStats();

      if (!preStats.success) {
        throw new Error('No se pudieron obtener estadísticas previas');
      }

      // Paso 2: Ejecutar migración
      const migrationResult = await this.migrateAnonymousData(realUserId);

      if (!migrationResult.success) {
        throw new Error(`Migración falló: ${migrationResult.error}`);
      }

      // Paso 3: Verificar migración
      const postStats = await this.getAnonymousStats();

      // Paso 4: Compilar resultado completo
      const result = {
        success: true,
        conversion: {
          userId: realUserId,
          anonymousUserId: this.ANONYMOUS_USER_ID,

          // Estadísticas antes de la migración
          beforeMigration: preStats.stats,

          // Datos migrados
          migration: migrationResult.migration,

          // Estadísticas después (debería ser cero)
          afterMigration: postStats.stats,

          // Resumen
          summary: {
            lessonsTransferred: migrationResult.migration.migrated_lessons,
            attemptsTransferred: migrationResult.migration.migrated_attempts,
            hadDataToMigrate: preStats.hasData,
            migrationTimestamp: migrationResult.migration.migration_timestamp
          }
        }
      };

      console.log('🏆 Conversión completada exitosamente:', result.conversion.summary);

      return result;

    } catch (error) {
      console.error('❌ Error en convertAnonymousUser:', error);
      return {
        success: false,
        error: error.message,
        conversion: null
      };
    }
  }

  /**
   * ✅ Valida formato UUID
   * 
   * @param {string} uuid - UUID a validar
   * @returns {boolean} True si es válido
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 🧹 Limpia datos residuales del usuario anónimo
   */
  static async clearAnonymousData() {
    try {
      this.clearAnonymousDataSync();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static clearAnonymousDataSync() {
    db.run('DELETE FROM quiz_attempts WHERE user_id = ?', [this.ANONYMOUS_USER_ID]);
    db.run('DELETE FROM user_lesson_progress WHERE user_id = ?', [this.ANONYMOUS_USER_ID]);
    db.run('DELETE FROM user_exercise_progress WHERE user_id = ?', [this.ANONYMOUS_USER_ID]);
    db.run('DELETE FROM user_achievements WHERE user_id = ?', [this.ANONYMOUS_USER_ID]);
  }
}

export default AnonymousUserMigrationService;

