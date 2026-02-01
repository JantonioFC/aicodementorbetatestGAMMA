/**
 * Tests for LessonEvaluator
 */

// Mock the database
jest.mock('../../../lib/db', () => ({
    run: jest.fn(),
    get: jest.fn()
}));

// Mock uuid - use CommonJS style mock
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

const { LessonEvaluator } = require('../../../lib/evaluation/LessonEvaluator');

describe('LessonEvaluator', () => {
    let evaluator;

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
                    { pregunta: 'Q1', opciones: ['a', 'b', 'c', 'd'], correcta: 0 },
                    { pregunta: 'Q2', opciones: ['a', 'b', 'c', 'd'], correcta: 1 },
                    { pregunta: 'Q3', opciones: ['a', 'b', 'c', 'd'], correcta: 2 }
                ]
            };

            const result = evaluator.evaluate(cleanLesson, mockContext);
            expect(result.scores.noHallucination).toBe(100);
            expect(result.hasQuiz).toBe(true);
        });

        test('evaluates structure correctly', () => {
            const structuredLesson = {
                contenido: `# Título de la Lección
                
## Introducción
Contenido aquí.

## Ejemplo
Imagina que tienes un sprite...

## Analogía
Es como un semáforo...`,
                quiz: [
                    { pregunta: 'Q1', opciones: ['a', 'b', 'c', 'd'], correcta: 0 },
                    { pregunta: 'Q2', opciones: ['a', 'b', 'c', 'd'], correcta: 1 },
                    { pregunta: 'Q3', opciones: ['a', 'b', 'c', 'd'], correcta: 2 }
                ]
            };

            const result = evaluator.evaluate(structuredLesson, mockContext);
            expect(result.details.structure.hasTitle).toBe(true);
            expect(result.details.structure.hasSubtitles).toBe(true);
            expect(result.details.structure.hasQuiz).toBe(true);
        });

        test('evaluates length requirements', () => {
            const shortLesson = {
                contenido: 'Muy corto',
                quiz: []
            };

            const longLesson = {
                contenido: 'palabra '.repeat(900), // 900 words
                quiz: []
            };

            const shortResult = evaluator.evaluate(shortLesson, mockContext);
            const longResult = evaluator.evaluate(longLesson, mockContext);

            expect(shortResult.scores.length).toBeLessThan(longResult.scores.length);
        });

        test('calculates overall score as weighted average', () => {
            const lesson = {
                contenido: 'Contenido neutral',
                quiz: []
            };

            const result = evaluator.evaluate(lesson, mockContext);

            // Overall should be between 0 and 100
            expect(result.scores.overall).toBeGreaterThanOrEqual(0);
            expect(result.scores.overall).toBeLessThanOrEqual(100);
        });
    });
});
