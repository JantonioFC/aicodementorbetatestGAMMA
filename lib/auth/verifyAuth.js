/**
 * VERIFICACIÓN DE AUTENTICACIÓN - Sistema IRP
 * MISIÓN 191 - FASE 1: MVP del Sistema de Peer Review Automatizado
 * 
 * Módulo básico de verificación de autenticación JWT para el endpoint
 * POST /api/v1/review/generate del Sistema IRP.
 * 
 * NOTA: Esta es una implementación simplificada para el MVP.
 * En producción debe integrarse con Supabase Auth completo.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @fecha 2025-09-26
 */

import AuthLocal from '../../lib/auth-local.js';

/**
 * Verifica la validez de un token JWT de autenticación
 * 
 * @param {string} token - Token JWT a verificar
 * @returns {Promise<Object>} Resultado de la verificación
 * 
 * @example
 * const result = await verifyAuthToken('eyJ...');
 * if (result.isValid) {
 *   console.log(`Usuario autenticado: ${result.userId}`);
 * }
 */
export async function verifyAuthToken(token) {
  try {
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        error: 'Token inválido o faltante'
      };
    }

    const result = AuthLocal.verifyToken(token);

    if (result.isValid) {
      return {
        isValid: true,
        userId: result.userId,
        email: result.email,
        role: result.role
      };
    }

    return {
      isValid: false,
      error: result.error || 'Token no autorizado'
    };

  } catch (error) {
    console.error('[AUTH] Error verificando token:', error.message);
    return {
      isValid: false,
      error: 'Error interno de autenticación'
    };
  }
}

export default {
  verifyAuthToken
};
