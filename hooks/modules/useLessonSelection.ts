import { useState, useMemo } from 'react';
import { Curriculum, CurriculumLessonInfo } from './useCurriculumSource';

/**
 * Hook para gestionar la selección jerárquica de lecciones
 * (Lenguaje -> Categoría -> Lección)
 */
export function useLessonSelection(curriculum: Curriculum) {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedLesson, setSelectedLesson] = useState<string>('');

    // Resetear dependencias
    const setLanguage = (lang: string) => {
        setSelectedLanguage(lang);
        setSelectedCategory('');
        setSelectedLesson('');
    };

    const setCategory = (cat: string) => {
        setSelectedCategory(cat);
        setSelectedLesson('');
    };

    const resetSelection = () => {
        setSelectedLanguage('');
        setSelectedCategory('');
        setSelectedLesson('');
    };

    // Computados (Memoized para performance)
    const availableCategories = useMemo(() => {
        if (!selectedLanguage || !curriculum[selectedLanguage]) return [];
        return Object.keys(curriculum[selectedLanguage]);
    }, [curriculum, selectedLanguage]);

    const availableLessons = useMemo(() => {
        if (!selectedLanguage || !selectedCategory || !curriculum[selectedLanguage]?.[selectedCategory]) return [];
        return Object.keys(curriculum[selectedLanguage][selectedCategory]);
    }, [curriculum, selectedLanguage, selectedCategory]);

    const currentLessonInfo = useMemo<CurriculumLessonInfo | null>(() => {
        if (!selectedLanguage || !selectedCategory || !selectedLesson) return null;
        return curriculum[selectedLanguage]?.[selectedCategory]?.[selectedLesson] || null;
    }, [curriculum, selectedLanguage, selectedCategory, selectedLesson]);

    return {
        // State
        selectedLanguage,
        selectedCategory,
        selectedLesson,
        // Actions
        setLanguage,
        setCategory,
        setLesson: setSelectedLesson,
        resetSelection,
        // Computed
        availableCategories,
        availableLessons,
        currentLessonInfo
    };
}
