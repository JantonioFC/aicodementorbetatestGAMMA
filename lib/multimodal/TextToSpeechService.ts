/**
 * Text-to-Speech Service
 * Genera audio de las lecciones para accesibilidad y aprendizaje auditivo.
 */

export interface TTSVoice {
    language: string;
    name: string;
    pitch: number;
    speakingRate: number;
}

export class TextToSpeechService {
    private providers: Record<string, { enabled: boolean; apiKey?: string; baseUrl?: string }>;
    private defaultVoice: TTSVoice;

    constructor() {
        this.providers = {
            fal: {
                enabled: !!process.env.FAL_API_KEY,
                apiKey: process.env.FAL_API_KEY,
                baseUrl: 'https://fal.run'
            },
            google: {
                enabled: !!process.env.GOOGLE_TTS_API_KEY,
                apiKey: process.env.GOOGLE_TTS_API_KEY
            }
        };

        this.defaultVoice = {
            language: 'es-ES',
            name: 'es-ES-Standard-A',
            pitch: 0,
            speakingRate: 0.95
        };
    }

    /**
     * Convierte texto a audio.
     */
    async synthesize(text: string, options: any = {}) {
        const {
            provider = 'fal',
            voice = this.defaultVoice.name,
        } = options;

        const cleanText = this._prepareTextForSpeech(text);

        if (provider === 'fal' && this.providers.fal.enabled) {
            return await this._synthesizeWithFal(cleanText, voice);
        }

        // Fallback: retornar SSML para uso en frontend con Web Speech API
        return {
            success: false,
            provider: 'browser',
            ssml: this._generateSSML(cleanText),
            text: cleanText,
            note: 'Use Web Speech API in browser'
        };
    }

    /**
     * Genera audio con fal.ai
     */
    private async _synthesizeWithFal(text: string, voice: string) {
        try {
            const response = await fetch(`${this.providers.fal.baseUrl}/fal-ai/metavoice-v1`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.providers.fal.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    speech_rate: 1.0
                })
            });

            if (!response.ok) {
                throw new Error(`Fal.ai TTS error: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                provider: 'fal',
                audioUrl: data.audio_url || data.audio?.url,
                duration: data.duration
            };
        } catch (error: any) {
            console.error('[TTS] Fal.ai error:', error.message);
            return {
                success: false,
                error: error.message,
                ssml: this._generateSSML(text),
                text
            };
        }
    }

    /**
     * Prepara el texto para síntesis de voz.
     */
    private _prepareTextForSpeech(text: string): string {
        return text
            // Eliminar bloques de código
            .replace(/```[\s\S]*?```/g, ' [código omitido] ')
            // Eliminar código inline
            .replace(/`[^`]+`/g, (match) => match.slice(1, -1))
            // Eliminar headers markdown
            .replace(/^#{1,6}\s+/gm, '')
            // Eliminar énfasis markdown
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            // Eliminar links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Eliminar listas
            .replace(/^[-*]\s+/gm, '')
            // Limpiar múltiples espacios
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Genera SSML para mejor control de la síntesis.
     */
    private _generateSSML(text: string): string {
        const paragraphs = text.split(/\n\n+/);
        const ssmlParts = paragraphs.map(p => `<p>${p.trim()}</p>`);

        return `<speak>
            <prosody rate="95%" pitch="0st">
                ${ssmlParts.join('\n<break time="500ms"/>\n')}
            </prosody>
        </speak>`;
    }

    /**
     * Genera script para Web Speech API (fallback del navegador).
     */
    public generateBrowserScript(text: string): string {
        const cleanText = this._prepareTextForSpeech(text);
        const escapedText = cleanText.replace(/'/g, "\\'").replace(/\n/g, ' ');

        return `
// Web Speech API - Text to Speech
(function() {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance('${escapedText}');
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    const voices = synth.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    synth.speak(utterance);
    return {
        pause: () => synth.pause(),
        resume: () => synth.resume(),
        stop: () => synth.cancel()
    };
})();`;
    }

    /**
     * Divide una lección larga en chunks para síntesis.
     */
    public splitIntoChunks(lessonContent: string, maxChars: number = 2000): string[] {
        const cleanText = this._prepareTextForSpeech(lessonContent);
        const sentences = cleanText.split(/(?<=[.!?])\s+/);

        const chunks: string[] = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChars) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += ' ' + sentence;
            }
        }

        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }

    /**
     * Verifica proveedores disponibles.
     */
    public getAvailableProviders(): string[] {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, _]) => name);
    }
}

export const textToSpeechService = new TextToSpeechService();
