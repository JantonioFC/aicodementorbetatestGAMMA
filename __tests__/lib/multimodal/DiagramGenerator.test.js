/**
 * Tests for DiagramGenerator
 */

const { DiagramGenerator } = require('../../../lib/multimodal/DiagramGenerator');

describe('DiagramGenerator', () => {
    let generator;

    beforeEach(() => {
        generator = new DiagramGenerator();
    });

    describe('generateForConcept', () => {
        test('generates conditional diagram for "condicional"', () => {
            const diagram = generator.generateForConcept('condicional');
            expect(diagram).toContain('mermaid');
            expect(diagram).toContain('flowchart');
            expect(diagram).toContain('Condición');
        });

        test('generates conditional diagram for "if"', () => {
            const diagram = generator.generateForConcept('if');
            expect(diagram).toContain('Condición');
        });

        test('generates loop diagram for "bucle"', () => {
            const diagram = generator.generateForConcept('bucle');
            expect(diagram).toContain('mermaid');
            expect(diagram).toContain('contador');
        });

        test('generates loop diagram for "repetir"', () => {
            const diagram = generator.generateForConcept('repetir');
            expect(diagram).toContain('contador');
        });

        test('generates sprite diagram for "sprite"', () => {
            const diagram = generator.generateForConcept('sprite');
            expect(diagram).toContain('mermaid');
            expect(diagram).toContain('Sprite');
            expect(diagram).toContain('Propiedades');
        });

        test('generates event diagram for "evento"', () => {
            const diagram = generator.generateForConcept('evento');
            expect(diagram).toContain('Eventos');
            expect(diagram).toContain('Bandera Verde');
        });

        test('generates message diagram for "mensaje"', () => {
            const diagram = generator.generateForConcept('mensaje');
            expect(diagram).toContain('sequenceDiagram');
            expect(diagram).toContain('Broadcast');
        });

        test('generates algorithm diagram for "algoritmo"', () => {
            const diagram = generator.generateForConcept('algoritmo');
            expect(diagram).toContain('Problema');
            expect(diagram).toContain('Solución');
        });

        test('generates variable diagram for "variable"', () => {
            const diagram = generator.generateForConcept('variable');
            expect(diagram).toContain('Variable');
            expect(diagram).toContain('Valor');
        });

        test('generates generic mindmap for unknown concepts', () => {
            const diagram = generator.generateForConcept('concepto_desconocido');
            expect(diagram).toContain('mindmap');
            expect(diagram).toContain('concepto_desconocido');
        });

        test('matches partial concept names', () => {
            const diagram = generator.generateForConcept('usando condicionales en scratch');
            expect(diagram).toContain('Condición');
        });
    });

    describe('enrichLessonWithDiagram', () => {
        test('appends diagram section to lesson content', () => {
            const content = 'Original lesson content here.';
            const enriched = generator.enrichLessonWithDiagram(content, 'bucle');

            expect(enriched).toContain(content);
            expect(enriched).toContain('## 📊 Diagrama Visual');
            expect(enriched).toContain('mermaid');
        });
    });
});
