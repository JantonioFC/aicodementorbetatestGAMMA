
import { GeminiProvider } from './GeminiProvider';
import { MockProvider } from './MockProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { logger } from '../../observability/Logger';
import { AIProvider } from './BaseProvider';

export class ProviderFactory {
    static getProvider(providerName: string = 'gemini', config: Record<string, any> = {}): AIProvider {
        try {
            if (process.env.USE_MOCK_AI === 'true') {
                logger.info('[ProviderFactory] Forzando MockProvider via env var');
                return new MockProvider();
            }

            switch (providerName.toLowerCase()) {
                case 'gemini':
                    const gemini = new GeminiProvider(config.modelName);
                    if (gemini.isAvailable()) {
                        return gemini;
                    }
                    logger.warn('[ProviderFactory] Gemini no disponible (falta API Key). Usando MockProvider.');
                    return new MockProvider();

                case 'openrouter':
                    // Config expects: { modelName, apiKey }
                    const openRouter = new OpenRouterProvider({
                        name: `openrouter/${config.modelName}`,
                        modelName: config.modelName,
                        apiKey: config.apiKey
                    });
                    if (openRouter.isAvailable()) {
                        return openRouter;
                    }
                    logger.warn('[ProviderFactory] OpenRouter key missing or invalid.');
                    return new MockProvider();

                case 'mock':
                    return new MockProvider();

                default:
                    logger.warn(`[ProviderFactory] Proveedor desconocido '${providerName}'. Usando Gemini por defecto.`);
                    const defaultProvider = new GeminiProvider(config.modelName);
                    return defaultProvider.isAvailable() ? defaultProvider : new MockProvider();
            }
        } catch (error) {
            logger.error('[ProviderFactory] Error inicializando proveedor', error);
            return new MockProvider();
        }
    }
}
