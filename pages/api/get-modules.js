// AI CODE MENTOR - Get Modules Endpoint
// MIGRATED to Local-First Architecture (SQLite)

import { getCurriculumSummary } from '../../lib/curriculum-sqlite';
// Import progress tracking if available, or use placeholder
// import * as jsonDb from '../../lib/database-json'; 

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('📋 Recuperando módulos de la base de datos local (SQLite)...');

    // Obtener estructura completa del currículo
    const summary = getCurriculumSummary();

    // Aplanar la estructura jerárquica (Fases -> Módulos) a una lista plana de módulos
    const allModules = [];

    summary.curriculum.forEach(fase => {
      fase.modulos.forEach(modulo => {
        allModules.push({
          id: modulo.modulo, // Usamos el número de módulo como ID
          title: modulo.titulo_modulo,
          filename: `modulo-${modulo.modulo}`, // Slug generado
          uploadDate: new Date().toISOString(), // Fecha simulada
          total_lessons: modulo.semanas.length,
          completed_lessons: 0, // TODO: Conectar con sistema de progreso real
          total_exercises: 0,   // TODO: Conectar con sistema de ejercicios
          completed_exercises: 0,
          status: 'active' // Default status
        });
      });
    });

    console.log(`✅ ${allModules.length} módulos encontrados en SQLite`);

    // Formatear módulos para el frontend
    const formattedModules = allModules.map(module => {
      // Calcular progreso porcentual (actualmente 0)
      const lessonProgress = module.total_lessons > 0
        ? Math.round((module.completed_lessons / module.total_lessons) * 100)
        : 0;

      const exerciseProgress = module.total_exercises > 0
        ? Math.round((module.completed_exercises / module.total_exercises) * 100)
        : 0;

      return {
        id: module.id,
        title: module.title,
        filename: module.filename,
        status: module.status,
        uploadDate: module.uploadDate,
        lessons: {
          total: module.total_lessons || 0,
          completed: module.completed_lessons || 0,
          progress: lessonProgress
        },
        exercises: {
          total: module.total_exercises || 0,
          completed: module.completed_exercises || 0,
          progress: exerciseProgress
        },
        overallProgress: Math.round((lessonProgress + exerciseProgress) / 2)
      };
    });

    // Ordenar por ID de módulo
    formattedModules.sort((a, b) => a.id - b.id);

    res.json({
      success: true,
      modules: formattedModules,
      stats: {
        totalModules: summary.totalModules,
        totalLessons: summary.totalWeeks,
        completedLessons: 0, // Placeholder
        totalExercises: 0,
        completedExercises: 0,
        overallProgress: 0
      }
    });

  } catch (error) {
    console.error('❌ Error recuperando módulos (SQLite):', error.message);
    res.status(500).json({
      error: 'Error interno recuperando módulos',
      details: error.message
    });
  }
}
