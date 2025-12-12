// pages/api/v1/sandbox/history/[id].js
// MIGRATED TO SQLITE

import { withRequiredAuth } from '../../../../../utils/authMiddleware';
import db from '../../../../../lib/db';

async function deleteGenerationHandler(req, res) {
  const { method } = req;
  const { isAuthenticated, user, userId } = req.authContext;
  const { id: generationId } = req.query;

  if (method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!generationId) {
    return res.status(400).json({ success: false, error: 'Bad Request' });
  }

  try {
    // Delete only if belongs to user
    const result = db.run('DELETE FROM sandbox_generations WHERE id = ? AND user_id = ?', [generationId, userId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Generación no encontrada o no tienes permisos'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Generación eliminada exitosamente'
    });

  } catch (error) {
    console.error('[SANDBOX-DELETE] Error inesperado:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export default withRequiredAuth(deleteGenerationHandler);
