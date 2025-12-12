// pages/api/achievements/check.js
// Trigger manual para verificar y otorgar logros
// MIGRATED to Local-First (Supabase removed)

import { checkAndAwardAchievements } from '../../../lib/achievements/engine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Usar usuario demo o ID proporcionado
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user-id';

    console.log(`[API] Verificando logros para: ${userId}`);

    // Llamar al motor de logros local
    const achievementResult = await checkAndAwardAchievements(userId, null);

    if (!achievementResult.success) {
      throw new Error(achievementResult.error);
    }

    return res.status(200).json({
      message: 'Achievements checked successfully',
      ...achievementResult
    });

  } catch (error) {
    console.error('Error in /api/achievements/check:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
