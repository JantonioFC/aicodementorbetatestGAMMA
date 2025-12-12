/**
 * API endpoint for updating competency tracking
 * POST /api/update-competency
 * MIGRATED TO SQLITE
 */

import db from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return await handleCreateCompetency(req, res);
  } else if (req.method === 'GET') {
    return await handleGetCompetencies(req, res);
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to create, GET to retrieve.'
    });
  }
}

async function handleCreateCompetency(req, res) {
  try {
    const {
      competency_name,
      competency_category,
      level_achieved,
      evidence_description,
      evidence_module_id,
      evidence_project_entry_id
    } = req.body;

    if (!competency_name || !evidence_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: competency_name and evidence_description are required.'
      });
    }

    const level = level_achieved ? parseInt(level_achieved) : 1;

    // Insert
    const id = `comp_${Date.now()}`;
    db.insert('competency_log', {
      id,
      competency_name,
      competency_category: competency_category || 'General',
      level_achieved: level,
      evidence_description,
      evidence_module_id,
      evidence_project_entry_id,
      achieved_date: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Competency logged successfully',
      competency_id: id,
      competency_name,
      level_achieved: level
    });

  } catch (error) {
    console.error('Error creating competency:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while logging competency'
    });
  }
}

async function handleGetCompetencies(req, res) {
  try {
    const { category, stats, recent, limit } = req.query;

    if (stats === 'true') {
      const total = db.get('SELECT COUNT(*) as count FROM competency_log').count;
      return res.status(200).json({ success: true, stats: { total } });
    }

    if (recent === 'true') {
      const l = limit ? parseInt(limit) : 5;
      const comps = db.query('SELECT * FROM competency_log ORDER BY achieved_date DESC LIMIT ?', [l]);
      return res.status(200).json({ success: true, recent_competencies: comps, count: comps.length });
    }

    const comps = category
      ? db.query('SELECT * FROM competency_log WHERE competency_category = ?', [category])
      : db.query('SELECT * FROM competency_log');

    return res.status(200).json({
      success: true,
      competencies: comps,
      count: comps.length,
      filters: { category: category || 'all' }
    });

  } catch (error) {
    console.error('Error getting competencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching competencies'
    });
  }
}
