export interface AgentResponse {
    content: string;
    metadata: {
        agentName: string;
        confidence: number;
        role: string;
        [key: string]: unknown;
    };
}

export interface AgentContext {
    userId?: string;
    topic: string;
    difficulty: string;
    language: string;
    sessionHistory?: Array<{ role: string; content: string }>;
    [key: string]: unknown;
}

export interface BaseAgent {
    name: string;
    role: string;
    process(input: string, context: AgentContext): Promise<AgentResponse>;
}
