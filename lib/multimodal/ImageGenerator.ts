/**
 * Image Generator Service
 * Genera imágenes educativas usando APIs externas (fal.ai o Gemini).
 */

export class ImageGenerator {
    private providers: Record<string, { enabled: boolean; apiKey?: string; baseUrl?: string }>;

    constructor() {
        // Configuración de proveedores
        this.providers = {
            fal: {
                enabled: !!process.env.FAL_API_KEY,
                apiKey: process.env.FAL_API_KEY,
                baseUrl: 'https://fal.run'
            },
            gemini: {
                enabled: !!process.env.GEMINI_API_KEY,
                apiKey: process.env.GEMINI_API_KEY
            }
        };
    }

    /**
     * Genera una imagen educativa basada en un prompt.
     */
    async generate(prompt: string, options: any = {}) {
        const {
            provider = 'fal',
            style = 'educational',
            size = '512x512'
        } = options;

        // Enriquecer el prompt para contexto educativo
        const educationalPrompt = this._buildEducationalPrompt(prompt, style);

        if (provider === 'fal' && this.providers.fal.enabled) {
            return await this._generateWithFal(educationalPrompt, size);
        }

        // Fallback: retornar placeholder
        return {
            success: false,
            error: 'No image provider configured',
            placeholder: this._getPlaceholder(prompt)
        };
    }

    /**
     * Genera imagen con fal.ai
     */
    private async _generateWithFal(prompt: string, size: string) {
        try {
            const response = await fetch(`${this.providers.fal.baseUrl}/fal-ai/flux/schnell`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.providers.fal.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    image_size: size,
                    num_images: 1
                })
            });

            if (!response.ok) {
                throw new Error(`Fal.ai error: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                provider: 'fal',
                url: data.images?.[0]?.url,
                prompt
            };
        } catch (error: any) {
            console.error('[ImageGenerator] Fal.ai error:', error.message);
            return {
                success: false,
                error: error.message,
                placeholder: this._getPlaceholder(prompt)
            };
        }
    }

    /**
     * Construye un prompt optimizado para contenido educativo.
     */
    private _buildEducationalPrompt(userPrompt: string, style: string): string {
        const styles: Record<string, string> = {
            educational: 'Clean, simple educational illustration, colorful, child-friendly, no text, concept visualization,',
            diagram: 'Technical diagram, flowchart style, clean lines, minimal, professional,',
            cartoon: 'Cute cartoon illustration, friendly characters, bright colors, educational,',
            minimal: 'Minimalist icon style, flat design, single concept, clean background,'
        };

        const stylePrefix = styles[style] || styles.educational;
        return `${stylePrefix} ${userPrompt}`;
    }

    /**
     * Retorna un placeholder SVG para cuando no hay API disponible.
     */
    private _getPlaceholder(prompt: string) {
        const shortPrompt = prompt.substring(0, 50).replace(/[<>]/g, '');
        return {
            type: 'svg',
            content: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <rect fill="#f0f0f0" width="400" height="300"/>
                <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
                    🖼️ Imagen: ${shortPrompt}
                </text>
            </svg>`,
            description: prompt
        };
    }

    /**
     * Genera sugerencias de imágenes para una lección.
     */
    public suggestImagesForLesson(context: any): { description: string; suggestedStyle: string }[] {
        const { concepto_del_dia, texto_del_pomodoro, tematica_semanal } = context;

        const suggestions: { description: string; suggestedStyle: string }[] = [];

        if (concepto_del_dia) {
            suggestions.push({
                description: `Educational illustration of: ${concepto_del_dia} in programming`,
                suggestedStyle: 'educational'
            });
        }

        if (tematica_semanal?.toLowerCase().includes('scratch')) {
            suggestions.push({
                description: 'Colorful Scratch programming interface with blocks and sprites',
                suggestedStyle: 'cartoon'
            });
        }

        suggestions.push({
            description: `Simple visualization of: ${texto_del_pomodoro || 'programming concept'}`,
            suggestedStyle: 'minimal'
        });

        return suggestions;
    }

    /**
     * Verifica qué proveedores están disponibles.
     */
    public getAvailableProviders(): string[] {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, _]) => name);
    }
}

// Exportar singleton
export const imageGenerator = new ImageGenerator();
