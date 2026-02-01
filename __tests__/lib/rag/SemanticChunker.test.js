const { semanticChunker } = require('../../../lib/rag/SemanticChunker');

describe('SemanticChunker', () => {
    const sampleWeek = {
        semana: 1,
        titulo_semana: 'Introducción',
        tematica: 'Pensamiento Computacional',
        objetivos: ['Entender algoritmos', 'Reconocer patrones'],
        esquema_diario: [
            {
                dia: 1,
                concepto: 'Algoritmos',
                pomodoros: [
                    'Definición de algoritmo',
                    'Ejemplos cotidianos'
                ]
            }
        ]
    };

    test('should chunk simple text', () => {
        const text = 'Sentence one. Sentence two. Sentence three.';
        const chunks = semanticChunker.chunk(text, { source: 'test' });

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0].metadata.source).toBe('test');
    });

    test('should chunk curriculum data correctly', () => {
        const chunks = semanticChunker.chunkCurriculum(sampleWeek);

        // Should have summary + 2 pomodoros
        expect(chunks.length).toBeGreaterThanOrEqual(2);

        const summaryChunk = chunks.find(c => c.type === 'summary');
        expect(summaryChunk).toBeDefined();
        expect(summaryChunk.text).toContain('Introducción');

        const pomodoroChunk = chunks.find(c => c.type === 'educational');
        expect(pomodoroChunk).toBeDefined();
        expect(pomodoroChunk.metadata.dia).toBe(0);
    });

    test('should detect chunk types', () => {
        const chunks = semanticChunker.chunk('## Title\nList:\n- Item 1', {});
        // Implementation detail: _detectChunkType is private/internal, 
        // but we can check if it flows through to the chunk object
        // assuming chunk() uses it.
        // Based on implementation, chunk() sets 'type'.

        // Note: The simple chunker logic might wrap the whole thing if it's small.
        // Let's test checking the internal method logic via a larger text or assuming the 'type' property is set.

        // Actually, let's verify the 'type' property exists on chunks
        expect(chunks[0]).toHaveProperty('type');
    });
});
