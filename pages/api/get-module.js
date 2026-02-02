// AI CODE MENTOR - Get Module Details Endpoint
// FASE 2: Recupera un módulo específico con sus lecciones y ejercicios
// MIGRATED TO SQLITE

const db = require('../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { moduleId } = req.query;

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId es requerido' });
    }

    console.log(`📖 Recuperando módulo ${moduleId}...`);

    // Obtener módulo
    const moduleData = db.findOne('modules', { id: moduleId });

    if (!moduleData) {
      return res.status(404).json({ error: 'Módulo no encontrado' });
    }

    // Obtener lecciones del módulo
    const lessons = db.find('lessons', { module_id: moduleId });

    // Obtener ejercicios para cada lección
    const lessonsWithExercises = lessons.map(lesson => {
      const exercises = db.find('exercises', { lesson_id: lesson.id });

      return {
        id: lesson.id,
        lessonNumber: lesson.lesson_number,
        title: lesson.title,
        difficulty: lesson.difficulty,
        content: lesson.content,
        completed: lesson.completed === 1,
        completedDate: lesson.completed_date,
        exercises: exercises.map(ex => ({
          id: ex.id,
          exerciseNumber: ex.exercise_number,
          description: ex.description,
          completed: ex.completed === 1,
          solution: ex.solution,
          userSolution: ex.user_solution,
          completedDate: ex.completed_date
        }))
      };
    });

    // Calcular progreso
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.completed === 1).length;

    const allExercises = lessonsWithExercises.flatMap(l => l.exercises);
    const totalExercises = allExercises.length;
    const completedExercises = allExercises.filter(e => e.completed === true).length;

    console.log(`✅ Módulo encontrado con ${lessons.length} lecciones`);

    res.json({
      success: true,
      module: {
        id: moduleData.id,
        title: moduleData.title,
        filename: moduleData.filename,
        status: moduleData.status,
        uploadDate: moduleData.upload_date,
        content: moduleData.content, // Contenido original .md
        processedContent: moduleData.processed_content ? JSON.parse(moduleData.processed_content) : null,
        lessonCount: moduleData.lesson_count
      },
      lessons: lessonsWithExercises,
      progress: {
        totalLessons: totalLessons,
        completedLessons: completedLessons,
        totalExercises: totalExercises,
        completedExercises: completedExercises,
        lastActivity: null, // Not tracked trivially
        lessonProgress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        exerciseProgress: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ Error recuperando módulo:', error.message);
    res.status(500).json({
      error: 'Error interno recuperando módulo',
      details: error.message
    });
  }
}
