export interface AgentResponse {
    content: string;
    metadata: {
        agentName: string;
        confidence: number;
        role: string;
        [key: string]: any;
    };
}

export interface AgentContext {
    userId?: string;
    topic: string;
    difficulty: string;
    language: string;
    sessionHistory?: any[];
    [key: string]: any;
}

export interface BaseAgent {
    name: string;
    role: string;
    process(input: string, context: AgentContext): Promise<AgentResponse>;
}
