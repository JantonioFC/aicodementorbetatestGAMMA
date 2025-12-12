/**
 * MISIÓN 268 - FASE 2: ENDPOINT DE LIMPIEZA DE ESTADO E2E
 * 
 * PROPÓSITO:
 * Este endpoint limpia el estado del usuario de CI en la base de datos después
 * de que todos los tests E2E han finalizado. 
 * MIGRADO A LOCAL-FIRST (SQLite).
 */

import { withRequiredAuth } from '../../../utils/authMiddleware';
import db from '../../../lib/db';

async function handler(req, res) {
  // PASO 1: Validar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  // PASO 2: El middleware ya validó la autenticación
  // authContext contiene userId y userEmail
  const { userId, userEmail } = req.authContext;

  // PASO 3: Validar que es el usuario de CI
  const ciUserEmail = process.env.TEST_USER_EMAIL || process.env.CI_USER_EMAIL;

  if (userEmail !== ciUserEmail) {
    console.log(`⛔ [M-268 Cleanup] Acceso denegado: ${userEmail} no es el usuario de CI`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: No es el usuario de CI'
    });
  }

  console.log(`🧹 [M-268 Cleanup] Iniciando limpieza de estado para: ${userId} (${userEmail})`);

  try {
    // PASO 4: Limpiar tabla sandbox_generations
    console.log('[M-268 Cleanup] Limpiando sandbox_generations...');
    const sandboxResult = db.run('DELETE FROM sandbox_generations WHERE user_id = ?', [userId]);
    const sandboxCount = sandboxResult.changes;

    console.log(`✅ [M-268 Cleanup] ${sandboxCount || 0} registros eliminados de sandbox_generations`);

    // PASO 5: Limpiar tabla est_progress
    console.log('[M-268 Cleanup] Limpiando est_progress...');
    const progressResult = db.run('DELETE FROM est_progress WHERE user_id = ?', [userId]);
    const progressCount = progressResult.changes;

    console.log(`✅ [M-268 Cleanup] ${progressCount || 0} registros eliminados de est_progress`);

    // PASO 6: Retornar éxito
    console.log(`✅ [M-268 Cleanup] Estado limpiado exitosamente para: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Estado de E2E limpiado',
      metadata: {
        userId,
        userEmail,
        deletedRecords: {
          sandboxGenerations: sandboxCount || 0,
          estProgress: progressCount || 0
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [M-268 Cleanup] Error limpiando estado:', error.message);

    res.status(500).json({
      success: false,
      message: error.message,
      metadata: {
        userId,
        userEmail,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Exportar con middleware de autenticación
export default withRequiredAuth(handler);
