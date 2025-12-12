// pages/api/progress-summary.js
// MISIÓN 145 FASE 1 - ENDPOINT DE RESUMEN DE PROGRESO DEL ESTUDIANTE
// MIGRATED TO SQLITE

import { withRequiredAuth } from '../../utils/authMiddleware';
import db from '../../lib/db';

async function progressSummaryHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Use GET.'
    });
  }

  try {
    const { isAuthenticated, user, userId } = req.authContext;

    console.log(`[PROGRESS-SUMMARY] Obteniendo resumen para: ${user.email} (${userId})`);

    // Get lesson progress
    const lessonProgress = db.query(`
        SELECT lesson_id, completed, completed_at, progress_percentage, time_spent_seconds
        FROM user_lesson_progress
        WHERE user_id = ?
        ORDER BY completed_at DESC
    `, [userId]);

    // Get exercise progress
    const exerciseProgress = db.query(`
        SELECT exercise_id, lesson_id, completed, completed_at, attempts_count, best_score, time_spent_seconds
        FROM user_exercise_progress
        WHERE user_id = ?
        ORDER BY completed_at DESC
    `, [userId]);

    // Calculate aggregated metrics
    const completedLessons = lessonProgress.filter(l => l.completed === 1) || [];
    const completedExercises = exerciseProgress.filter(e => e.completed === 1) || [];

    // Total "Pomodoros" (completed activities)
    const totalPomodorosCompleted = completedLessons.length + completedExercises.length;

    // Last completed block
    const allCompletedActivities = [
      ...completedLessons.map(l => ({
        type: 'lesson',
        id: l.lesson_id,
        completed_at: l.completed_at,
        time_spent: l.time_spent_seconds
      })),
      ...completedExercises.map(e => ({
        type: 'exercise',
        id: e.exercise_id,
        lesson_id: e.lesson_id,
        completed_at: e.completed_at,
        time_spent: e.time_spent_seconds,
        score: e.best_score,
        attempts: e.attempts_count
      }))
    ].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const lastCompletedBlock = allCompletedActivities.length > 0 ? allCompletedActivities[0] : null;

    // Determine current block
    const currentBlock = calculateCurrentBlock(totalPomodorosCompleted);

    // Calculate phase completion
    const phaseCompletionPercentage = calculatePhaseCompletion(totalPomodorosCompleted);

    // Stats
    const stats = {
      totalLessonsStarted: lessonProgress.length,
      totalLessonsCompleted: completedLessons.length,
      totalExercisesStarted: exerciseProgress.length,
      totalExercisesCompleted: completedExercises.length,
      averageTimePerActivity: calculateAverageTime(allCompletedActivities),
      totalTimeSpent: allCompletedActivities.reduce((total, activity) => total + (activity.time_spent || 0), 0)
    };

    const progressSummary = {
      totalPomodorosCompleted,
      lastCompletedBlock,
      currentBlock,
      phaseCompletionPercentage,
      stats,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: progressSummary
    });

  } catch (error) {
    console.error('[PROGRESS-SUMMARY] Error en endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener resumen de progreso',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'progress-summary'
      } : undefined
    });
  }
}

function calculateCurrentBlock(totalCompleted) {
  const activitiesPerPhase = 20;
  const currentPhase = Math.floor(totalCompleted / activitiesPerPhase) + 1;
  const currentWeek = Math.floor((totalCompleted % activitiesPerPhase) / 4) + 1;
  const currentDay = (totalCompleted % 4) + 1;

  return {
    phase: Math.min(currentPhase, 7),
    week: currentWeek,
    day: currentDay,
    description: `Fase ${Math.min(currentPhase, 7)}, Semana ${currentWeek}, Día ${currentDay}`
  };
}

function calculatePhaseCompletion(totalCompleted) {
  const activitiesPerPhase = 20;
  const currentPhaseProgress = totalCompleted % activitiesPerPhase;
  return Math.round((currentPhaseProgress / activitiesPerPhase) * 100);
}

function calculateAverageTime(activities) {
  if (activities.length === 0) return 0;

  const totalTime = activities.reduce((sum, activity) => sum + (activity.time_spent || 0), 0);
  return Math.round(totalTime / activities.length);
}

export default withRequiredAuth(progressSummaryHandler);
