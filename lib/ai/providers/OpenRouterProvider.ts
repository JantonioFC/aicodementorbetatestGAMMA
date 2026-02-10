
import { BaseProvider, AnalysisRequest, AnalysisResponse, AnalysisAnalysis, ProviderConfig } from './BaseProvider';

export class OpenRouterProvider extends BaseProvider {
    private apiKey: string;
    private modelName: string;
    private siteUrl: string;
    private appName: string;

    constructor(config: ProviderConfig) {
        super({ name: config.modelName || 'openai/gpt-3.5-turbo' });
        this.apiKey = config.apiKey || '';
        this.modelName = config.modelName || 'openai/gpt-3.5-turbo';
        this.siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        this.appName = 'AI Code Mentor';
    }

    isAvailable(): boolean {
        return !!this.apiKey && this.apiKey.startsWith('sk-or-');
    }

    override getName(): string {
        return `openrouter/${this.modelName}`;
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
        if (!this.isAvailable()) {
            throw new Error('OpenRouter API Key missing or invalid');
        }

        const startTime = Date.now();
        const { code, language, phase } = request;

        const systemPrompt = request.systemPrompt || this.buildSystemPrompt(phase || 'fase-1');

        // Note: explicit casting
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
            const messages: any[] = [];
            if (request.messages && Array.isArray(request.messages) && request.messages.length > 0) {
                // Map to OpenAI/OpenRouter format
                request.messages.forEach(msg => {
                    messages.push({ role: msg.role, content: msg.content });
                });
            } else {
                messages.push({ role: "system", content: systemPrompt });
                messages.push({ role: "user", content: userPrompt });
            }

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": this.siteUrl,
                    "X-Title": this.appName,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": this.modelName,
                    "messages": messages,
                    "response_format": { "type": "json_object" } // Force JSON if supported
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const responseText = data.choices[0].message.content;

            const parsedResponse = super.parseResponse(responseText);
            const latency = Date.now() - startTime;

            return this.formatResponse(parsedResponse, {
                tokensUsed: data.usage?.total_tokens || 0,
                latency
            });

        } catch (error: any) {
            console.error(`[OpenRouterProvider] Error with ${this.modelName}:`, error.message);
            throw error;
        }
    }

    private formatResponse(rawResponse: any, metadata: { tokensUsed: number, latency: number }): AnalysisResponse {
        const analysis: AnalysisAnalysis = {
            feedback: rawResponse.feedback || '',
            strengths: Array.isArray(rawResponse.strengths) ? rawResponse.strengths : [],
            improvements: Array.isArray(rawResponse.improvements) ? rawResponse.improvements : [],
            examples: Array.isArray(rawResponse.examples) ? rawResponse.examples : [],
            score: typeof rawResponse.score === 'number' ? rawResponse.score : null
        };

        return {
            analysis,
            metadata: {
                model: this.getName(),
                tokensUsed: metadata.tokensUsed,
                latency: metadata.latency,
                timestamp: new Date().toISOString()
            }
        };
    }
}
