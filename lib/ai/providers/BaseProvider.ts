
/**
 * Base AI Provider Interface and Abstract Class
 * Defines the contract that all AI providers must implement.
 */

export interface AnalysisRequest {
    code?: string;
    language?: string;
    phase?: string;
    analysisType?: string;
    systemPrompt?: string;
    userPrompt?: string;
    messages?: Array<{ role: 'user' | 'model'; content: string }>;
}

export interface AnalysisAnalysis {
    feedback: string;
    strengths: string[];
    improvements: string[];
    examples: string[];
    score: number | null;
    [key: string]: any;
}

export interface AnalysisResponse {
    analysis: AnalysisAnalysis;
    metadata: {
        model: string;
        tokensUsed: number;
        latency: number;
        timestamp: string;
    };
}

export interface ProviderConfig {
    name: string;
    [key: string]: any; // Allow extra config
}

export interface AIProvider {
    name: string;
    isAvailable(): boolean;
    getName(): string;
    analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
}

export abstract class BaseProvider implements AIProvider {
    name: string;
    config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.name = config.name || 'unknown-provider';
        this.config = config;
    }

    /**
     * Check if provider is configured and available
     */
    abstract isAvailable(): boolean;

    /**
     * Get provider name
     */
    getName(): string {
        return this.name;
    }

    /**
     * Analyze code
     */
    abstract analyze(request: AnalysisRequest): Promise<AnalysisResponse>;

    /**
     * Parse text response to JSON
     */
    protected parseResponse(text: string): any {
        // Default simplistic parser, can be overridden
        try {
            return JSON.parse(text);
        } catch (e) {
            return { raw: text };
        }
    }
}
