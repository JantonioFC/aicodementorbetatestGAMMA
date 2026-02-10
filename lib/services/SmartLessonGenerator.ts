
import { ClarityGate, LowConfidenceError } from '../ai/ClarityGate';
// @ts-ignore: Legacy JS imports
import { queryExpander } from '../rag/QueryExpander';
// @ts-ignore: Legacy JS imports
import { contentRetriever } from '../rag/ContentRetriever';
import { lessonService, LessonRequest, LessonContent } from './LessonService';
import { logger } from '../utils/logger';

export class SmartLessonGenerator {
    private gate: ClarityGate;
    private maxRetries: number;

    constructor() {
        this.gate = new ClarityGate();
        this.maxRetries = 2;
    }

    /**
     * Agentic Flow:
     * 1. Initial Retrieval
     * 2. Clarity Check
     * 3. (Optional) Expansion & Retry
     * 4. Generation
     */
    async generateWithAutonomy(params: LessonRequest): Promise<LessonContent> {
        let retrievalContext: string[] = await this._retrieve(params.topic);
        let retries = 0;
        let clarityPass = false;

        // --- Clarity Assurance Loop ---
        while (retries < this.maxRetries && !clarityPass) {
            try {
                // Check if context is good enough
                await this.gate.checkRelevance(params.topic, retrievalContext);
                clarityPass = true;
                logger.info(`[SmartGen] Clarity Check Passed (Attempt ${retries + 1})`);
            } catch (error: any) {
                if (error instanceof LowConfidenceError || error.name === 'LowConfidenceError') {
                    logger.warn(`[SmartGen] Clarity Check Failed: ${error.message}. Retrying...`);

                    if (queryExpander && typeof (queryExpander as any).expand === 'function') {
                        const expandedQueries: string[] = await (queryExpander as any).expand(params.topic, { useLLM: true });
                        const additionalContext = await Promise.all(
                            expandedQueries.map((q: string) => this._retrieve(q))
                        );

                        // Merge contexts (simple flattening)
                        const flatAdditional = additionalContext.flat();
                        retrievalContext = [...retrievalContext, ...flatAdditional];
                    }

                    retries++;
                } else {
                    throw error;
                }
            }
        }

        if (!clarityPass) {
            logger.warn('[SmartGen] Max retries reached. Proceeding with best available context.');
        }

        // --- Generation Phase ---
        // Inject validated context into params for the base service
        return lessonService.generateLesson({
            ...params,
            injectedContext: retrievalContext
        });
    }

    private async _retrieve(query: string): Promise<string[]> {
        // Wrapper for ContentRetriever
        try {
            if (contentRetriever && typeof (contentRetriever as any).retrieve === 'function') {
                const results = await (contentRetriever as any).retrieve(query);
                // Ensure array of strings
                if (Array.isArray(results)) {
                    return results.map((r: any) => typeof r === 'string' ? r : JSON.stringify(r));
                }
                return [];
            }
            return []; // Fallback
        } catch (e: any) {
            logger.error(`[SmartGen] Retrieval error: ${e.message}`);
            return [];
        }
    }
}

export const smartLessonGenerator = new SmartLessonGenerator();
