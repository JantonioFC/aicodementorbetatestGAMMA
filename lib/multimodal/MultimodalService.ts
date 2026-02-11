import { diagramGenerator } from './DiagramGenerator';
import { imageGenerator } from './ImageGenerator';
import { speechAnalysisService } from './SpeechAnalysisService';
import { textToSpeechService } from './TextToSpeechService';

/**
 * Multimodal Service - Orquestador de Generación Visual
 */
export const multimodalService = {
    /**
     * Enriquece una lección con diagramas e imágenes sugeridas
     */
    async enrichLesson(lessonContent: string, concept: string): Promise<string> {
        let enriched = diagramGenerator.enrichLessonWithDiagram(lessonContent, concept);

        // Sugerir imágenes (no las genera automáticamente para ahorrar recursos)
        const suggestions = imageGenerator.suggestImagesForLesson({ concepto_del_dia: concept });

        if (suggestions.length > 0) {
            enriched += `\n\n--- \n\n### 💡 Sugerencias Visuales\n`;
            suggestions.forEach(s => {
                enriched += `- **${s.description}**: Utilizar estilo *${s.suggestedStyle}*.\n`;
            });
        }

        return enriched;
    },

    /**
     * Obtiene las capacidades del sistema multimodal
     */
    getCapabilities() {
        return {
            diagrams: true,
            images: true,
            audio: true,
            voiceAnalysis: true,
            video: false,
            providers: ['Mermaid', 'Fal.ai', 'WebSpeechAPI']
        };
    }
};

export default multimodalService;
