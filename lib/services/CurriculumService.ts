import db from '../db';

export class CurriculumService {
    /**
     * Procesa contenido Markdown para generar lecciones con IA.
     */
    async processModule(filename: string, content: string) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        const moduleId = `module_${Date.now()}`;
        const moduleTitle = filename.replace('.md', '').replace(/[-_]/g, ' ');

        db.insert('modules', {
            id: moduleId,
            title: moduleTitle,
            filename: filename,
            content: content,
            status: 'processing',
            lesson_count: 0
        });

        // En producción esto llamaría a Gemini recursivamente. 
        // Para la migración base, mantenemos la estructura.
        const sections = content.split(/^#{1,2}\s+/m).filter(s => s.trim().length > 50);

        // Simulación de procesamiento (en un sistema real usaríamos el loop de Gemini)
        sections.forEach((section, i) => {
            const lessonId = `lesson_${moduleId}_${i + 1}`;
            db.insert('lessons', {
                id: lessonId,
                module_id: moduleId,
                lesson_number: i + 1,
                title: section.split('\n')[0].trim(),
                difficulty: 'intermedio',
                content: section,
                completed: 0
            });
        });

        db.update('modules', {
            status: 'completed',
            lesson_count: sections.length,
            processed_content: JSON.stringify({ lessons: sections.length, processedAt: new Date().toISOString() })
        }, { id: moduleId });

        return { moduleId, lessonsCount: sections.length };
    }

    deleteModule(moduleId: string) {
        return db.run('DELETE FROM modules WHERE id = ?', [moduleId]);
    }
}

export const curriculumService = new CurriculumService();
