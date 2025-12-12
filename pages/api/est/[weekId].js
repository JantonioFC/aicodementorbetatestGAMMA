// ================================================================================
// AI CODE MENTOR - MISIÓN 157 FASE 2: API EST PROGRESS (LOCAL)
// ================================================================================
// Archivo: /pages/api/est/[weekId].js
// Objetivo: API para persistencia del progreso EST por semana (SQLite Local)
// Versión: 2.0 - Migrado a Local First
// ================================================================================

import db from '../../../lib/db';
import { withRequiredAuth } from '../../../utils/authMiddleware.js';

// Estado por defecto del checklist EST
const DEFAULT_CHECKED_STATE = {
  ejercicios: false,
  miniProyecto: false,
  dma: false,
  commits: false
};

// Validador de weekId
function validateWeekId(weekId) {
  const week = parseInt(weekId);
  if (isNaN(week) || week < 1 || week > 100) {
    throw new Error(`WeekId inválido: ${weekId}. Debe estar entre 1-100.`);
  }
  return week;
}

// Validador de checked_state
function validateCheckedState(checkedState) {
  if (!checkedState || typeof checkedState !== 'object') {
    throw new Error('checked_state debe ser un objeto');
  }

  const requiredKeys = ['ejercicios', 'miniProyecto', 'dma', 'commits'];
  const receivedKeys = Object.keys(checkedState);

  // Verificar que todas las claves requeridas estén presentes
  for (const key of requiredKeys) {
    if (!(key in checkedState)) {
      throw new Error(`Falta la clave requerida: ${key}`);
    }
    if (typeof checkedState[key] !== 'boolean') {
      throw new Error(`El valor de ${key} debe ser boolean`);
    }
  }

  // Verificar que no hay claves adicionales no esperadas
  for (const key of receivedKeys) {
    if (!requiredKeys.includes(key)) {
      throw new Error(`Clave no esperada: ${key}`);
    }
  }

  return checkedState;
}

// Handler principal de la API con autenticación requerida
async function handler(req, res) {
  // Configurar CORS si es necesario
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  const { weekId } = req.query;

  try {
    // Validar weekId
    const validatedWeekId = validateWeekId(weekId);

    // Obtener contexto de autenticación del middleware
    const { isAuthenticated, userId } = req.authContext;

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Sesión de usuario requerida para acceder al progreso EST',
        code: 'UNAUTHORIZED'
      });
    }

    // Dispatch por método HTTP
    switch (req.method) {
      case 'GET':
        return await handleGetProgress(res, userId, validatedWeekId);

      case 'POST':
      case 'PUT':
      case 'PATCH':
        return await handleUpdateProgress(req, res, userId, validatedWeekId);

      default:
        return res.status(405).json({
          error: 'Método no permitido',
          message: `Método ${req.method} no es compatible con esta API`,
          allowedMethods: ['GET', 'POST', 'PUT', 'PATCH']
        });
    }

  } catch (error) {
    console.error('❌ Error en /api/est/[weekId]:', error);

    return res.status(400).json({
      error: 'Solicitud inválida',
      message: error.message,
      code: 'INVALID_REQUEST'
    });
  }
}

// Handler para GET: Recuperar progreso EST
async function handleGetProgress(res, userId, weekId) {
  try {
    console.log(`🔍 GET /api/est/${weekId} - Usuario: ${userId.substring(0, 8)}...`);

    // Consultar progreso existente
    const progress = db.findOne('est_progress', {
      user_id: userId,
      semana_id: weekId
    });

    if (progress) {
      // CASO 1: Progreso encontrado - devolver estado guardado
      console.log(`✅ Progreso EST encontrado para semana ${weekId}`);

      let checkedState = progress.checked_state;
      if (typeof checkedState === 'string') {
        try { checkedState = JSON.parse(checkedState); } catch (e) { }
      }

      return res.status(200).json({
        success: true,
        weekId: weekId,
        checkedState: checkedState,
        lastUpdated: progress.updated_at,
        fromDatabase: true,
        message: 'Progreso EST recuperado exitosamente'
      });

    } else {
      // CASO 2: Progreso no encontrado - devolver estado por defecto
      console.log(`📭 No hay progreso EST para semana ${weekId}, devolviendo estado por defecto`);

      return res.status(200).json({
        success: true,
        weekId: weekId,
        checkedState: DEFAULT_CHECKED_STATE,
        lastUpdated: null,
        fromDatabase: false,
        message: 'Estado por defecto - no hay progreso guardado para esta semana'
      });
    }

  } catch (error) {
    console.error('❌ Error en handleGetProgress:', error);

    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo recuperar el progreso EST',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
}

// Handler para POST/PUT/PATCH: Actualizar progreso EST
async function handleUpdateProgress(req, res, userId, weekId) {
  try {
    console.log(`💾 ${req.method} /api/est/${weekId} - Usuario: ${userId.substring(0, 8)}...`);

    // Validar payload
    const { checkedState } = req.body;

    if (!checkedState) {
      return res.status(400).json({
        error: 'Datos faltantes',
        message: 'El campo checkedState es requerido en el body',
        code: 'MISSING_CHECKED_STATE'
      });
    }

    // Validar estructura del checkedState
    const validatedCheckedState = validateCheckedState(checkedState);
    const checkedStateStr = JSON.stringify(validatedCheckedState);

    // UPSERT Logic for SQLite
    const existing = db.findOne('est_progress', { user_id: userId, semana_id: weekId });

    let result;
    const now = new Date().toISOString();

    if (existing) {
      db.update('est_progress', {
        checked_state: checkedStateStr,
        updated_at: now
      }, {
        user_id: userId,
        semana_id: weekId
      });
      result = { checked_state: validatedCheckedState, updated_at: now };
    } else {
      db.insert('est_progress', {
        user_id: userId,
        semana_id: weekId,
        checked_state: checkedStateStr,
        created_at: now,
        updated_at: now
      });
      result = { checked_state: validatedCheckedState, updated_at: now };
    }

    console.log(`✅ Progreso EST guardado exitosamente para semana ${weekId}`);

    const checkedCount = Object.values(validatedCheckedState).filter(Boolean).length;
    const totalCount = Object.keys(validatedCheckedState).length;
    const completionPercentage = Math.round((checkedCount / totalCount) * 100);

    return res.status(200).json({
      success: true,
      weekId: weekId,
      checkedState: result.checked_state,
      lastUpdated: result.updated_at,
      savedToDatabase: true,
      statistics: {
        completedTasks: checkedCount,
        totalTasks: totalCount,
        completionPercentage: completionPercentage
      },
      message: `Progreso EST actualizado exitosamente (${completionPercentage}% completado)`
    });

  } catch (error) {
    console.error('❌ Error en handleUpdateProgress:', error);

    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo guardar el progreso EST',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
}

export default withRequiredAuth(handler);