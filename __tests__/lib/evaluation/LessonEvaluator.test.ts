import { LessonEvaluator } from '../../../lib/evaluation/LessonEvaluator';

// Mock the database
jest.mock('../../../lib/db', () => ({
    db: {
        run: jest.fn(),
        get: jest.fn()
    }
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

describe('LessonEvaluator', () => {
    let evaluator: LessonEvaluator;

    beforeEach(() => {
        evaluator = new LessonEvaluator();
    });

    describe('evaluate', () => {
        const mockContext = {
            texto_del_pomodoro: 'Aprender sobre condicionales en Scratch',
            tematica_semanal: 'Scratch y pensamiento computacional',
            concepto_del_dia: 'Bloques de control'
        };

        test('scores faithfulness based on topic match', () => {
            const lesson = {
                contenido: 'En esta lección aprenderemos sobre condicionales usando bloques en Scratch',
                quiz: []
            };

            const result = evaluator.evaluate(lesson, mockContext);
            expect(result.scores.faithfulness).toBeGreaterThan(0);
        });

        test('detects hallucination terms', () => {
            const lessonWithHallucination = {
                contenido: 'Usa printf() para imprimir en la terminal y gcc para compilar',
                quiz: []
            };

            const result = evaluator.evaluate(lessonWithHallucination, mockContext);
            expect(result.scores.noHallucination).toBeLessThan(100);
            expect(result.details.noHallucination.prohibitedFound).toContain('printf');
        });

        test('passes clean lessons', () => {
            const cleanLesson = {
                contenido: 'Aprenderemos sobre condicionales en Scratch usando bloques de control. ' +
                    'Imagina que tienes un sprite que necesita tomar decisiones. ' +
                    'Ejemplo: si tocas el borde, entonces rebota. '.repeat(50),
                quiz: [
                    { pregunta: 'Q1', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'a', explicacion: 'Explicación Q1' },
                    { pregunta: 'Q2', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'b', explicacion: 'Explicación Q2' },
                    { pregunta: 'Q3', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'c', explicacion: 'Explicación Q3' }
                ]
            };

            const result = evaluator.evaluate(cleanLesson, mockContext);
            expect(result.scores.noHallucination).toBe(100);
            expect(result.hasQuiz).toBe(true);
        });

        test('evaluates structure correctly', () => {
            const structuredLesson = {
                contenido: `# Título de la Lección\n## Introducción\nContenido aquí.\n## Ejemplo\n## Analogía`,
                quiz: [
                    { pregunta: 'Q1', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'a', explicacion: 'Explicación Q1' },
                    { pregunta: 'Q2', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'b', explicacion: 'Explicación Q2' },
                    { pregunta: 'Q3', opciones: ['a', 'b', 'c', 'd'], respuesta_correcta: 'c', explicacion: 'Explicación Q3' }
                ]
            };

            const result = evaluator.evaluate(structuredLesson, mockContext);
            expect(result.details.structure.hasTitle).toBe(true);
            expect(result.details.structure.hasSubtitles).toBe(true);
            expect(result.details.structure.hasQuiz).toBe(true);
        });
    });
});
