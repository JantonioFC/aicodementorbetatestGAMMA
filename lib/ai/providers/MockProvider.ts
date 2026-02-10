
import { BaseProvider, AnalysisRequest, AnalysisResponse } from './BaseProvider';

export class MockProvider extends BaseProvider {
    constructor() {
        super({ name: 'mock-provider', displayName: 'Mock Provider (Fallback)' });
    }

    isAvailable(): boolean {
        return true;
    }

    async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
        return {
            analysis: {
                feedback: "Modo Offline/Mock: Este es un análisis simulado. Configura una API Key válida para obtener análisis real.",
                strengths: ["Código ejecutado en entorno seguro", "Estructura básica correcta"],
                improvements: ["Configurar API real", "Implementar manejo de errores robusto"],
                examples: [],
                score: 8.0
            },
            metadata: {
                model: 'mock-model',
                tokensUsed: 0,
                latency: 10,
                timestamp: new Date().toISOString()
            }
        };
    }
}
