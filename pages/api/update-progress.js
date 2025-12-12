// AI CODE MENTOR - Update Progress Endpoint
// FASE 2: Actualiza el progreso de lecciones y ejercicios
// MIGRATED TO SQLITE

const db = require('../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { type, id, completed, userSolution } = req.body;

    if (!type || !id) {
      return res.status(400).json({ error: 'type e id son requeridos' });
    }

    console.log(`🔄 Actualizando progreso: ${type} ${id}`);

    let moduleId;

    switch (type) {
      case 'lesson':
        if (completed === false) {
          db.run('UPDATE lessons SET completed = 0, completed_date = NULL WHERE id = ?', [id]);
          const lesson = db.findOne('lessons', { id });
          moduleId = lesson?.module_id;
        } else {
          db.run('UPDATE lessons SET completed = 1, completed_date = ? WHERE id = ?', [new Date().toISOString(), id]);
          const lesson = db.findOne('lessons', { id });
          moduleId = lesson?.module_id;
        }
        break;

      case 'exercise':
        if (completed === false) {
          db.run('UPDATE exercises SET completed = 0, completed_date = NULL, user_solution = NULL WHERE id = ?', [id]);
          const exercise = db.query('SELECT e.*, l.module_id FROM exercises e JOIN lessons l ON e.lesson_id = l.id WHERE e.id = ?', [id])[0];
          moduleId = exercise?.module_id;
        } else {
          db.run('UPDATE exercises SET completed = 1, completed_date = ?, user_solution = ? WHERE id = ?', [new Date().toISOString(), userSolution || null, id]);
          const exercise = db.query('SELECT e.*, l.module_id FROM exercises e JOIN lessons l ON e.lesson_id = l.id WHERE e.id = ?', [id])[0];
          moduleId = exercise?.module_id;
        }
        break;

      case 'reset':
        // Implement logic to reset module progress if needed
        moduleId = id;
        break;
    }

    // Update aggregate progress if possible
    // Simplified logic: just recalculate and update 'progress' table if it existed, but here we just return success

    res.json({
      success: true,
      message: 'Progreso actualizado'
    });

  } catch (error) {
    console.error('❌ Error actualizando progreso:', error.message);
    res.status(500).json({
      error: 'Error interno actualizando progreso',
      details: error.message
    });
  }
}
