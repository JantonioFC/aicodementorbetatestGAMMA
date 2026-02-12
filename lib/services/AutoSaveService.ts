import fs from 'fs';
import path from 'path';

const AUTO_SAVE_DIRS = {
    lessons: 'exports/lecciones',
    exercises: 'exports/ejercicios',
    progress: 'exports/progreso',
    corrections: 'exports/correcciones',
    sessions: 'exports/sesiones'
};

export interface AutoSaveStats {
    total_lessons: number;
    total_exercises: number;
    total_sessions: number;
}

export class AutoSaveService {
    ensureDirectories(): void {
        Object.values(AUTO_SAVE_DIRS).forEach(dir => {
            const fullPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        });
    }

    saveLesson(lesson: { path: string } & Record<string, unknown>, metadata: Record<string, unknown> = {}): { filename: string } {
        this.ensureDirectories();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${lesson.path.replace(/\./g, '_')}_${timestamp}`;

        fs.writeFileSync(
            path.join(process.cwd(), AUTO_SAVE_DIRS.lessons, `${filename}.json`),
            JSON.stringify({ ...lesson, auto_saved_at: new Date().toISOString(), metadata }, null, 2)
        );

        return { filename };
    }

    saveSession(sessionData: Record<string, unknown>): string {
        this.ensureDirectories();
        const id = `session_${Date.now()}`;
        fs.writeFileSync(
            path.join(process.cwd(), AUTO_SAVE_DIRS.sessions, `${id}.json`),
            JSON.stringify({ ...sessionData, id, saved_at: new Date().toISOString() }, null, 2)
        );
        return id;
    }

    getStatistics(): AutoSaveStats {
        const stats: AutoSaveStats = { total_lessons: 0, total_exercises: 0, total_sessions: 0 };
        const lessonDir = path.join(process.cwd(), AUTO_SAVE_DIRS.lessons);
        if (fs.existsSync(lessonDir)) stats.total_lessons = fs.readdirSync(lessonDir).length;
        return stats;
    }
}

export const autoSaveService = new AutoSaveService();
