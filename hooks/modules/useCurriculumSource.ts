import { useState, useEffect, useCallback } from 'react';

export interface CurriculumLessonInfo {
    title: string;
    topics: string[];
    difficulty: string;
    estimated_time: string;
    source_url: string;
}

export type Curriculum = Record<string, Record<string, Record<string, CurriculumLessonInfo>>>;

/**
 * Hook para cargar y gestionar el currículo desde sources.json
 */
export function useCurriculumSource() {
    const [curriculum, setCurriculum] = useState<Curriculum>({});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadCurriculum = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/sources.json');
            if (!response.ok) {
                throw new Error('Error cargando el curriculum');
            }
            const data = await response.json();
            setCurriculum(data.curriculum || {});
            setError(null);
        } catch (err: any) {
            console.error('Error cargando curriculum:', err);
            setError('No se pudo cargar el curriculum. Verifique que sources.json esté disponible.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCurriculum();
    }, [loadCurriculum]);

    return { curriculum, error, isLoading, reload: loadCurriculum };
}
