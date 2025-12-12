// lib/achievements/engine.js
// MISIÓN 160 FASE 2 - MOTOR DE LOGROS (ACHIEVEMENTS ENGINE) - LOCAL VERSION
// Objetivo: Evaluar progreso del estudiante y otorgar logros automáticamente
// MIGRATED to use local database-json.js

import { getCurriculumSummary } from '../curriculum-sqlite.js';
import * as jsonDb from '../database-json.js';

/**
 * Motor principal de logros - Evalúa progreso y otorga achievements
 * @param {string} userId - UUID del usuario (local ID)
 * @param {Object} _unused_auth - Deprecated
 * @returns {Object} Resultado de la evaluación con logros otorgados
 */
export async function checkAndAwardAchievements(userId, _unused_auth) {
  try {
    console.log(`[ACHIEVEMENTS-ENGINE] Evaluando logros para usuario: ${userId}`);

    // PASO 1: Obtener resumen de progreso
    // Para la versión local, esto vendría de database-json o similar.
    // Por ahora simulamos un progreso básico o lo leemos si existe.
    const progressSummary = await getUserProgressSummary(userId);

    // PASO 2: Obtener logros (simulados o de archivo local)
    const allAchievements = getLocalAchievements();

    // PASO 3: Obtener logros del usuario
    const userAchievements = jsonDb.getRecentCompetencies(100) || [];
    // Nota: competencies no son exactamente achievements, pero es lo que tenemos localmente por ahora.
    // Si queremos achievements reales, deberíamos agregarlos a database-json.js

    const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.id)); // ID might need mapping

    const newlyUnlockedAchievements = [];

    // Simulación: No otorgamos logros complejos en esta versión inicial de migración
    // a menos que implementemos el almacenamiento en JSON.

    return {
      success: true,
      summary: {
        totalAchievementsEvaluated: allAchievements.length,
        alreadyUnlocked: unlockedAchievementIds.size,
        newlyUnlocked: newlyUnlockedAchievements.length
      },
      newlyUnlockedAchievements,
      progressSummary: {
        totalSemanasCompletadas: progressSummary.totalSemanasCompletadas,
        porcentajeTotalCompletado: progressSummary.porcentajeTotalCompletado,
        fasesCompletadas: 0
      }
    };

  } catch (error) {
    console.error('[ACHIEVEMENTS-ENGINE] Error en motor de logros:', error);
    return {
      success: false,
      error: error.message,
      newlyUnlockedAchievements: []
    };
  }
}

/**
 * Obtener resumen de progreso del usuario (Local)
 */
async function getUserProgressSummary(userId) {
  // TODO: Implementar lectura real de progreso desde SQLite/JSON
  // Por ahora devolvemos un estado base
  const curriculumData = await getCurriculumSummary();

  return {
    totalSemanasIniciadas: 0,
    totalSemanasCompletadas: 0,
    porcentajeTotalCompletado: 0,
    progresoPorFase: []
  };
}

/**
 * Obtener logros ya obtenidos por un usuario
 */
export async function getUserAchievements(userId, _unused_auth) {
  try {
    console.log(`[ACHIEVEMENTS-ENGINE] Obteniendo logros para usuario: ${userId}`);

    // Mapeamos las "competencias" locales a "logros" para mantener la UI funcionando
    const competencies = jsonDb.getRecentCompetencies(100);

    const formattedAchievements = competencies.map(c => ({
      id: c.id,
      name: c.competency_name,
      description: c.evidence_description || 'Competencia lograda',
      icon: '🏆', // Default icon
      criteria: {},
      unlockedAt: c.achieved_date
    }));

    return {
      success: true,
      achievements: formattedAchievements,
      count: formattedAchievements.length
    };

  } catch (error) {
    console.error('[ACHIEVEMENTS-ENGINE] Error obteniendo logros de usuario:', error);
    return {
      success: false,
      error: error.message,
      achievements: [],
      count: 0
    };
  }
}

// Helper para obtener definicion de logros (Mock)
function getLocalAchievements() {
  return [
    { id: 'start', name: 'Primer Paso', description: 'Completar la primera semana', icon: '🚀' },
    // ... más logros
  ];
}
