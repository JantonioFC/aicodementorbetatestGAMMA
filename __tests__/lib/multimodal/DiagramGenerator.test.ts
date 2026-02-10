import { DiagramGenerator } from '../../../lib/multimodal/DiagramGenerator';

describe('DiagramGenerator', () => {
    let generator: DiagramGenerator;

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

        test('generates loop diagram for "bucle"', () => {
            const diagram = generator.generateForConcept('bucle');
            expect(diagram).toContain('mermaid');
            expect(diagram).toContain('contador');
        });

        test('generates sprite diagram for "sprite"', () => {
            const diagram = generator.generateForConcept('sprite');
            expect(diagram).toContain('mermaid');
            expect(diagram).toContain('Sprite');
        });

        test('generates message diagram for "mensaje"', () => {
            const diagram = generator.generateForConcept('mensaje');
            expect(diagram).toContain('sequenceDiagram');
        });

        test('generates generic mindmap for unknown concepts', () => {
            const diagram = generator.generateForConcept('concepto_desconocido');
            expect(diagram).toContain('mindmap');
            expect(diagram).toContain('concepto_desconocido');
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
