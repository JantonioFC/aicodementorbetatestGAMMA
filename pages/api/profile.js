// pages/api/profile.js
// MISIÓN 69.1 FASE 4 - ENDPOINT UNIFICADO CON MIDDLEWARE DE AUTENTICACIÓN
// MIGRATED TO SQLITE

import { withOptionalAuth, createAdaptiveResponse, logAuthContext } from '../../utils/authMiddleware';
import db from '../../lib/db';

async function profileHandler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Use GET o POST.'
    });
  }

  try {
    logAuthContext(req, 'PROFILE');

    const { isAuthenticated, user, userId } = req.authContext;

    if (req.method === 'POST') {
      if (!isAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'Autenticación requerida para actualizar perfil',
          requireAuth: true
        });
      }

      console.log(`[PROFILE] Actualizando perfil para: ${user.email} (${userId})`);

      const updates = req.body;
      const updatedProfile = await updateUserProfile(userId, updates, user);

      return res.status(200).json({
        success: true,
        authenticated: true,
        message: 'Perfil actualizado exitosamente',
        profile: updatedProfile
      });
    }

    if (req.method === 'GET') {
      if (isAuthenticated) {
        console.log(`[PROFILE] Obteniendo perfil personal para: ${user.email} (${userId})`);

        const profile = await getUserProfile(userId, user);

        const authenticatedResponse = {
          profile,
          capabilities: [
            'Ver progreso personal',
            'Actualizar información',
            'Gestionar preferencias',
            'Ver estadísticas detalladas'
          ]
        };

        return res.status(200).json(createAdaptiveResponse(req, authenticatedResponse, null));

      } else {
        console.log('[PROFILE] Obteniendo perfil público para usuario anónimo');
        // Return basic profile struct for anon
        const anonymousResponse = {
          profile: { display_name: 'Guest User' },
          type: 'public',
          note: 'Perfil público. Inicia sesión para gestionar tu perfil personal.',
          limitations: [
            'Solo información básica disponible',
            'Sin progreso personal',
            'Sin capacidad de edición'
          ]
        };

        return res.status(200).json(createAdaptiveResponse(req, null, anonymousResponse));
      }
    }

  } catch (error) {
    console.error('[PROFILE] Error en endpoint unificado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al gestionar perfil',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        endpoint: 'profile-unified'
      } : undefined
    });
  }
}

async function getUserProfile(userId, authUser) {
  try {
    console.log(`[PROFILE] Obteniendo perfil para ${authUser.email}...`);

    let profile = db.findOne('user_profiles', { id: userId });

    if (!profile) {
      console.log(`[PROFILE] Creando perfil inicial para ${authUser.email}...`);

      const newProfile = {
        id: userId,
        email: authUser.email,
        display_name: authUser.email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.insert('user_profiles', newProfile);
      profile = newProfile;
    }

    const progressStats = await getUserProgressStats(userId);

    const completeProfile = {
      ...profile,
      authData: {
        email: authUser.email,
        emailVerified: true, // Assuming local auth is verified or irrelevant
        lastSignIn: new Date().toISOString(), // Mock timestamp for now
        createdAt: profile.created_at
      },
      stats: progressStats
    };

    return completeProfile;

  } catch (error) {
    console.error('[PROFILE] Error en getUserProfile:', error);
    throw error;
  }
}

async function updateUserProfile(userId, updates, authUser) {
  try {
    console.log(`[PROFILE] Actualizando perfil para ${authUser.email}...`);

    const allowedFields = ['display_name', 'bio', 'learning_goals', 'preferences'];
    const cleanUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        cleanUpdates[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      }
    }

    cleanUpdates.updated_at = new Date().toISOString();

    db.update('user_profiles', cleanUpdates, { id: userId });

    return db.findOne('user_profiles', { id: userId });

  } catch (error) {
    console.error('[PROFILE] Error en updateUserProfile:', error);
    throw error;
  }
}

async function getUserProgressStats(userId) {
  try {
    // Statistics queries
    const quizStats = db.get(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
        FROM quiz_attempts
        WHERE user_id = ?
    `, [userId]);

    const lessonsCount = db.get(`
        SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = ? AND completed = 1
    `, [userId]).count;

    const exercisesCount = db.get(`
        SELECT COUNT(*) as count FROM user_exercise_progress WHERE user_id = ? AND completed = 1
    `, [userId]).count;

    const stats = {
      quiz: {
        total: quizStats.total || 0,
        correct: quizStats.correct || 0,
        accuracy: quizStats.total > 0 ? Math.round((quizStats.correct / quizStats.total) * 100) : 0
      },
      progress: {
        lessonsCompleted: lessonsCount,
        exercisesCompleted: exercisesCount,
        totalActivities: (quizStats.total || 0) + lessonsCount + exercisesCount
      },
      streak: 0, // Implement streak calculation if needed
      lastActivity: new Date().toISOString(), // Mock
      joinedDate: new Date().toISOString() // Mock
    };

    return stats;

  } catch (error) {
    console.error('[PROFILE] Error en getUserProgressStats:', error);
    return {
      quiz: { total: 0, correct: 0, accuracy: 0 },
      progress: { lessonsCompleted: 0, exercisesCompleted: 0, totalActivities: 0 },
      streak: 0,
      lastActivity: null,
      joinedDate: null
    };
  }
}

export default withOptionalAuth(profileHandler);
