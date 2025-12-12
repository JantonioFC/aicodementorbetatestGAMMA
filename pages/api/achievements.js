// pages/api/achievements.js
// Obtiene los logros de un usuario
// MIGRATED to Local-First (Supabase removed)

import { getUserAchievements } from '../../lib/achievements/engine.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // En versión local, asumimos un usuario demo por defecto o tomamos el ID del query/header
    // pero para mantener compatibilidad simple, usaremos un ID fijo 'local-user' si no se provee.
    const userId = req.query.userId || req.headers['x-user-id'] || 'demo-user-id';

    // Llamamos al motor de logros local (ya no requiere supabase auth client)
    const achievementsResult = await getUserAchievements(userId, null);

    if (!achievementsResult.success) {
      throw new Error(achievementsResult.error);
    }

    return res.status(200).json(achievementsResult);

  } catch (error) {
    console.error('Error in /api/achievements:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
