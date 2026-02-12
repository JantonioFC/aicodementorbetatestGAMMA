
import { BaseProvider, AnalysisRequest, AnalysisResponse, AnalysisAnalysis, ProviderConfig } from './BaseProvider';
import { GoogleGenerativeAI, GenerativeModel, ChatSession, Content } from '@google/generative-ai';
import { logger } from '../../observability/Logger';

/**
 * Configuración de modelos Gemini
 */
interface GeminiModelConfig extends ProviderConfig {
    displayName: string;
    maxTokens: number;
    temperature: number;
    priority: number;
    capabilities: string[];
}

const MODEL_CONFIGS: Record<string, GeminiModelConfig> = {
    'gemini-2.5-flash': {
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        maxTokens: 65536,
        temperature: 0.4,
        priority: 1,
        capabilities: ['code-analysis', 'fast-response', 'high-capacity']
    },
    'gemini-2.5-pro': {
        name: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        maxTokens: 65536,
        temperature: 0.4,
        priority: 2,
        capabilities: ['code-analysis', 'complex-reasoning', 'high-capacity']
    },
    'gemini-2.0-flash': {
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        maxTokens: 8192,
        temperature: 0.4,
        priority: 3,
        capabilities: ['code-analysis', 'fast-response']
    },
    'gemini-2.0-flash-exp': {
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        maxTokens: 8192,
        temperature: 0.4,
        priority: 4,
        capabilities: ['code-analysis', 'experimental']
    }
};

// Modelo por defecto (el más estable y disponible)
const DEFAULT_MODEL = 'gemini-2.5-flash';

export class GeminiProvider extends BaseProvider {
    private apiKey: string;
    private modelName: string;
    private client: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    public override config: GeminiModelConfig;

    constructor(modelName: string = DEFAULT_MODEL) {
        const config = MODEL_CONFIGS[modelName] || MODEL_CONFIGS[DEFAULT_MODEL];
        super(config);

        this.modelName = modelName;
        this.config = config;
        this.apiKey = process.env.GEMINI_API_KEY || '';

        if (this.isAvailable()) {
            this.client = new GoogleGenerativeAI(this.apiKey);
            this.model = this.client.getGenerativeModel({
                model: this.config.name,
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens,
                    temperature: this.config.temperature
                }
            });
        }
    }

    isAvailable(): boolean {
        return !!this.apiKey && this.apiKey !== 'your-api-key-here';
    }

    override getName(): string {
        return this.modelName;
    }

    private buildSystemPrompt(phase: string): string {
        const prompts: Record<string, string> = {
            'fase-0': `Eres un tutor muy paciente que enseña programación a principiantes completos.
- Usa lenguaje muy simple y ejemplos visuales
- No asumas conocimiento previo de programación
- Celebra cada pequeño logro
- Evita conceptos avanzados como async, classes, POO`,

            'fase-1': `Eres un asistente educativo que guía en fundamentos de programación.
- Enfócate en buenas prácticas de código limpio
- Introduce debugging strategies
- Explica el razonamiento detrás de las sugerencias`,

            'fase-2': `Eres un mentor que ayuda a consolidar fundamentos y explorar conceptos intermedios.
- Introduce estructuras de datos básicas
- Fomenta modularización del código
- Sugiere mejoras de legibilidad`,

            'fase-5': `Eres un mentor senior que ayuda con arquitectura y diseño avanzado.
- Haz code review de nivel profesional
- Sugiere patrones de diseño cuando sean apropiados
- Considera performance y mantenibilidad`,

            'fase-7': `Eres un par técnico experto que hace code review de nivel profesional.
- Evalúa arquitectura y escalabilidad
- Sugiere optimizaciones avanzadas
- Considera trade-offs de diseño`
        };

        return prompts[phase] || prompts['fase-1'];
    }

    async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
        if (!this.isAvailable() || !this.model) {
            throw new Error('GeminiProvider no está disponible: API key no configurada');
        }

        const startTime = Date.now();
        const { code, language, phase, analysisType } = request;

        const systemPrompt = request.systemPrompt || this.buildSystemPrompt(phase || 'fase-1');

        // Note: Using explicit casting for language to string if defined, or default
        const lang = language || 'JavaScript';

        const userPrompt = request.userPrompt || `
Analiza el siguiente código ${lang}:

\`\`\`${lang.toLowerCase()}
${code}
\`\`\`

Proporciona:
1. Feedback constructivo sobre el código
2. Fortalezas identificadas
3. Áreas de mejora específicas
4. Ejemplos de cómo mejorar (si aplica)

Responde en formato JSON con esta estructura exacta:
{
  "feedback": "tu análisis general aquí",
  "strengths": ["fortaleza1", "fortaleza2"],
  "improvements": ["mejora1", "mejora2"],
  "examples": ["ejemplo de código mejorado si aplica"],
  "score": 7.5
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni bloques de código markdown.
    `;

        try {
            let history: Content[] = [];
            let currentPrompt = userPrompt;

            if (request.messages && Array.isArray(request.messages) && request.messages.length > 0) {
                const previousMessages = request.messages.slice(0, -1);
                const lastMessage = request.messages[request.messages.length - 1];

                history = previousMessages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));

                if (lastMessage && lastMessage.role === 'user') {
                    currentPrompt = lastMessage.content;
                }
            } else {
                history = [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Entendido, estoy listo para analizar código con este enfoque.' }]
                    }
                ];
            }

            const chat: ChatSession = this.model.startChat({
                history: history
            });

            const result = await chat.sendMessage(currentPrompt);
            const responseText = result.response.text();

            const parsedResponse = super.parseResponse(responseText);
            const latency = Date.now() - startTime;

            return this.formatResponse(parsedResponse, {
                tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
                latency
            });

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`[GeminiProvider] Error con ${this.modelName}`, { error: message });
            throw error;
        }
    }

    private formatResponse(rawResponse: Record<string, unknown>, metadata: { tokensUsed: number, latency: number }): AnalysisResponse {
        const analysis: AnalysisAnalysis = {
            feedback: typeof rawResponse.feedback === 'string' ? rawResponse.feedback : '',
            strengths: Array.isArray(rawResponse.strengths) ? rawResponse.strengths.filter((s): s is string => typeof s === 'string') : [],
            improvements: Array.isArray(rawResponse.improvements) ? rawResponse.improvements.filter((i): i is string => typeof i === 'string') : [],
            examples: Array.isArray(rawResponse.examples) ? rawResponse.examples.filter((e): e is string => typeof e === 'string') : [],
            score: typeof rawResponse.score === 'number' ? rawResponse.score : null
        };

        return {
            analysis,
            metadata: {
                model: this.modelName,
                tokensUsed: metadata.tokensUsed,
                latency: metadata.latency,
                timestamp: new Date().toISOString()
            }
        };
    }

    static getSupportedModels(): GeminiModelConfig[] {
        return Object.values(MODEL_CONFIGS).sort((a, b) => a.priority - b.priority);
    }

    static isModelSupported(modelName: string): boolean {
        return modelName in MODEL_CONFIGS;
    }
}
