/**
 * API endpoint for getting project dashboard data
 * GET /api/get-dashboard
 */

import db from '../../lib/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    // Get stats from SQLite
    const totalEntries = db.get('SELECT COUNT(*) as count FROM portfolio_entries').count;
    const totalModules = db.get('SELECT COUNT(*) as count FROM modules').count;
    const recentEntries = db.query('SELECT * FROM portfolio_entries ORDER BY created_at DESC LIMIT 5');

    // Construct response matching expected format
    const dashboardData = {
      success: true,
      entryCounts: {
        total: totalEntries,
        modules: totalModules
      },
      recentEntries: recentEntries || [],
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error in /api/get-dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard data'
    });
  }
}
