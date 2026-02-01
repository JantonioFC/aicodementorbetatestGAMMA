/**
 * Multimodal Service
 * Orquesta la generación de contenido multimodal para lecciones.
 * Combina diagramas, imágenes y audio.
 * Parte de Phase 9: Multimodal Implementation
 */

const { diagramGenerator } = require('./DiagramGenerator');
const { imageGenerator } = require('./ImageGenerator');
const { textToSpeechService } = require('./TextToSpeechService');

class MultimodalService {
    /**
     * Enriquece una lección con contenido multimodal.
     * @param {Object} lesson - { contenido, quiz }
     * @param {Object} context - Contexto de la lección
     * @param {Object} options - Opciones de generación
     * @returns {Promise<Object>} Lección enriquecida
     */
    async enrichLesson(lesson, context, options = {}) {
        const {
            includeDiagram = true,
            includeImage = false, // Requiere API key
            includeAudio = false,  // Requiere API key o usa browser fallback
            concept = context.concepto_del_dia
        } = options;

        const enrichedLesson = { ...lesson };
        const multimodal = {};

        // 1. Generar diagrama (siempre disponible, no requiere API)
        if (includeDiagram) {
            try {
                const diagram = diagramGenerator.generateForConcept(concept);
                multimodal.diagram = {
                    type: 'mermaid',
                    code: diagram,
                    concept
                };

                // Añadir diagrama al contenido
                enrichedLesson.contenido = diagramGenerator.enrichLessonWithDiagram(
                    lesson.contenido,
                    concept
                );
            } catch (error) {
                console.warn('[MultimodalService] Error generando diagrama:', error.message);
            }
        }

        // 2. Generar imagen (requiere FAL_API_KEY)
        if (includeImage) {
            try {
                const imagePrompts = imageGenerator.suggestImagesForLesson(context);
                const imageResult = await imageGenerator.generate(imagePrompts[0]);

                multimodal.image = imageResult;

                // Si la imagen fue exitosa, añadir al contenido
                if (imageResult.success && imageResult.url) {
                    enrichedLesson.contenido += `\n\n## 🖼️ Ilustración\n\n![${concept}](${imageResult.url})`;
                }
            } catch (error) {
                console.warn('[MultimodalService] Error generando imagen:', error.message);
            }
        }

        // 3. Preparar audio (TTS)
        if (includeAudio) {
            try {
                // Dividir en chunks para TTS
                const chunks = textToSpeechService.splitIntoChunks(lesson.contenido);

                // Generar script para fallback de browser
                const browserScript = textToSpeechService.generateBrowserScript(lesson.contenido);

                multimodal.audio = {
                    available: true,
                    chunks: chunks.length,
                    browserScript,
                    // El frontend puede llamar a synthesize() para cada chunk si hay API
                    synthesizeEndpoint: '/api/v1/tts/synthesize'
                };
            } catch (error) {
                console.warn('[MultimodalService] Error preparando audio:', error.message);
            }
        }

        // 4. Añadir metadata de multimodal
        enrichedLesson.multimodal = {
            hasContent: Object.keys(multimodal).length > 0,
            ...multimodal
        };

        return enrichedLesson;
    }

    /**
     * Obtiene las capacidades multimodales disponibles.
     */
    getCapabilities() {
        return {
            diagrams: {
                available: true,
                provider: 'mermaid',
                concepts: ['condicional', 'bucle', 'sprite', 'evento', 'algoritmo', 'secuencia', 'variable']
            },
            images: {
                available: imageGenerator.getAvailableProviders().length > 0,
                providers: imageGenerator.getAvailableProviders(),
                note: 'Requiere FAL_API_KEY'
            },
            audio: {
                available: true,
                providers: [...textToSpeechService.getAvailableProviders(), 'browser'],
                note: 'Fallback a Web Speech API si no hay API key'
            }
        };
    }

    /**
     * Genera solo un diagrama para un concepto.
     */
    generateDiagram(concept) {
        return diagramGenerator.generateForConcept(concept);
    }

    /**
     * Genera solo una imagen para un prompt.
     */
    async generateImage(prompt, options = {}) {
        return imageGenerator.generate(prompt, options);
    }

    /**
     * Genera solo audio para un texto.
     */
    async generateAudio(text, options = {}) {
        return textToSpeechService.synthesize(text, options);
    }
}

// Exportar singleton
const multimodalService = new MultimodalService();
module.exports = { multimodalService, MultimodalService };
