import { ClarityGate, LowConfidenceError } from '../ai/ClarityGate';
import { queryExpander } from '../rag/QueryExpander';
import { contentRetriever } from '../rag/ContentRetriever';
import { competencyService } from './CompetencyService';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { lessonService, LessonRequest, LessonContent } from './LessonService';
import { logger } from '../observability/Logger';

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
        let currentDifficulty = params.difficulty;

        // --- Mastery-Based Difficulty Suggestion (Phase 11) ---
        if (params.userId && (!params.difficulty || params.difficulty === 'auto')) {
            const suggestion = await competencyService.suggestDifficulty(params.userId, params.topic);
            logger.info(`[SmartGen] Difficulty suggestion for ${params.topic}: Level ${suggestion.level} (${suggestion.reason})`);

            // Map level to string difficulty
            const difficultyMap: Record<number, string> = { 1: 'beginner', 2: 'intermediate', 3: 'advanced' };
            currentDifficulty = difficultyMap[suggestion.level] || 'beginner';
        }

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
            } catch (error: unknown) {
                if (error instanceof LowConfidenceError || (error instanceof Error && error.name === 'LowConfidenceError')) {
                    logger.warn(`[SmartGen] Clarity Check Failed: ${error instanceof Error ? error.message : String(error)}. Retrying...`);

                    if (queryExpander) {
                        const expandedQueries: string[] = await queryExpander.expand(params.topic, { useLLM: true });
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
        const initialLesson = await lessonService.generateLesson({
            ...params,
            difficulty: currentDifficulty,
            injectedContext: retrievalContext
        });

        // --- Multi-Agent Refinement Phase (Phase 11) ---
        const refinedContent = await agentOrchestrator.orchestrate(initialLesson.content, {
            userId: params.userId,
            topic: params.topic,
            difficulty: currentDifficulty,
            language: params.language || 'es'
        });

        return {
            ...initialLesson,
            content: refinedContent,
            metadata: {
                ...initialLesson.metadata,
                refinedByAgents: true
            }
        };
    }

    private async _retrieve(query: string): Promise<string[]> {
        // Wrapper for ContentRetriever
        try {
            if (contentRetriever) {
                const results = await contentRetriever.retrieve(query);
                // Ensure array of strings
                if (Array.isArray(results)) {
                    return results.map((r: unknown) => typeof r === 'string' ? r : JSON.stringify(r));
                }
                return [];
            }
            return []; // Fallback
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            logger.error(`[SmartGen] Retrieval error: ${message}`);
            return [];
        }
    }
}

export const smartLessonGenerator = new SmartLessonGenerator();
