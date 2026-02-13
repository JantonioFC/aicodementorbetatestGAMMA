import { NextRequest, NextResponse } from 'next/server';
import { geminiRouter } from '@/lib/ai/router/GeminiRouter';
import { promptFactory } from '@/lib/prompts/factory/PromptFactory';
import { getUserFriendlyMessage } from '@/lib/utils/errorHandler';
import { ProviderFactory } from '@/lib/ai/providers/ProviderFactory';

export async function POST(req: NextRequest) {
    try {
        const {
            code,
            language = 'javascript',
            phase = 'fase-1',
            analysisType = 'general'
        } = await req.json();

        if (!code || !code.trim()) {
            return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
        }

        if (code.length > 50000) {
            return NextResponse.json({ error: 'Código muy largo (máx 50,000 caracteres)' }, { status: 400 });
        }

        await geminiRouter.initialize();

        const promptData = promptFactory.buildPrompt({
            phase,
            language,
            analysisType,
            code
        });

        const providerOverride = req.headers.get('x-ai-provider');

        if (providerOverride === 'openrouter') {
            const apiKey = req.headers.get('x-openrouter-key');
            const modelOverride = req.headers.get('x-openrouter-model');

            if (!apiKey) {
                return NextResponse.json({ error: 'OpenRouter API Key requerida' }, { status: 400 });
            }

            const provider = ProviderFactory.getProvider('openrouter', {
                apiKey,
                modelName: modelOverride
            });

            const result = await provider.analyze({
                code,
                language,
                phase,
                analysisType,
                systemPrompt: promptData.system,
                userPrompt: promptData.user
            });

            return NextResponse.json({
                success: true,
                analysis: result.analysis,
                metadata: {
                    ...result.metadata,
                    phase,
                    language,
                    analysisType,
                    provider: 'openrouter'
                }
            });
        }

        const result = await geminiRouter.analyze({
            code,
            language,
            phase,
            analysisType,
            systemPrompt: promptData.system,
            userPrompt: promptData.user
        });

        return NextResponse.json({
            success: true,
            analysis: result.analysis,
            metadata: {
                ...result.metadata,
                phase,
                language,
                analysisType,
                routerVersion: '2.0.0'
            }
        });

    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        const userMessage = getUserFriendlyMessage(errorObj);
        return NextResponse.json({
            success: false,
            error: userMessage,
            details: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
        }, { status: 500 });
    }
}
