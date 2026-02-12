import { geminiRouter } from './router/GeminiRouter';
import { logger } from '../observability/Logger';
import { promptLoader } from '../prompts/PromptLoader';
import { AnalysisAnalysis } from './providers/BaseProvider';

export interface RelevanceResult {
    relevance_score: number;
    reasoning: string;
}

export class LowConfidenceError extends Error {
    score: number;

    constructor(message: string, score: number) {
        super(message);
        this.name = 'LowConfidenceError';
        this.score = score;
    }
}

export class ClarityGate {
    private threshold: number;

    constructor(threshold: number = 0.7) {
        this.threshold = threshold;
    }

    /**
     * Evaluates if the retrieved context is relevant enough for the query.
     * @param {string} query - The user's intent or topic.
     * @param {string | string[]} context - The retrieved snippets.
     * @returns {Promise<boolean>} - True if relevant, throws LowConfidenceError if not.
     */
    async checkRelevance(query: string, context: string | string[]): Promise<boolean> {
        const contextStr = Array.isArray(context) ? context.join('\n\n') : context;

        // Skip check if no context (let the generator handle 'no context' scenario, or fail here?)
        // If no context, retrieval failed. That's a different error.
        if (!contextStr || contextStr.length < 10) {
            logger.warn('[ClarityGate] No context provided to evaluate.');
            return true; // Pass through, let generator decide.
        }

        const clarityPrompts = promptLoader.load('clarity.json');

        const prompt = promptLoader.interpolate(clarityPrompts.relevance_check as string, {
            query: query,
            context_snippet: contextStr.substring(0, 3000) + ' ... (truncated)'
        });

        try {
            // geminiRouter is migrated to TS
            const response = await geminiRouter.analyze({
                userPrompt: prompt,
                systemPrompt: "You are a relevance evaluator. Respond with JSON containing relevance_score and reasoning.",
                messages: []
            });

            // The provider now returns the parsed JSON in response.analysis
            const result = this._parseResponse(response.analysis);

            logger.info(`[ClarityGate] Relevance Score: ${result.relevance_score} | ${result.reasoning}`);

            if (result.relevance_score < this.threshold) {
                throw new LowConfidenceError(
                    `Context relevance (${result.relevance_score}) below threshold (${this.threshold}). Reasoning: ${result.reasoning}`,
                    result.relevance_score
                );
            }

            return true;

        } catch (error: unknown) {
            if (error instanceof LowConfidenceError || (error instanceof Error && error.name === 'LowConfidenceError')) throw error;

            const message = error instanceof Error ? error.message : String(error);
            // If LLM fails, we fail open (log and proceed) to avoid blocking usage due to outage
            logger.error(`[ClarityGate] Evaluation failed: ${message}. Proceeding with caution.`);
            return true;
        }
    }

    private _parseResponse(response: AnalysisAnalysis | string): RelevanceResult {
        try {
            // Because our AnalysisAnalysis already has a structure that might match RelevanceResult 
            // via its flexible properties, or it might be raw string
            if (typeof response === 'object' && response !== null && 'relevance_score' in response) {
                return response as unknown as RelevanceResult;
            }

            const stringContent = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = stringContent.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as RelevanceResult;
            }

            return { relevance_score: 1.0, reasoning: "Parse Error" };
        } catch (e: unknown) {
            return { relevance_score: 1.0, reasoning: "Fallback (Parse Error)" };
        }
    }
}
