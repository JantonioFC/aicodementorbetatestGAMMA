export interface PromptVersion {
    version: string;
    description: string;
    createdAt: string;
    SYSTEM_PROMPT: string;
    LESSON_TEMPLATE: string;
    CHAIN_OF_THOUGHT?: string;
    supportsMultimodal?: boolean;
}

export const v100Base: PromptVersion = {
    version: 'v1.0.0-base',
    description: 'Prompt básico original',
    createdAt: '2025-01-01',
    SYSTEM_PROMPT: `Eres un tutor experto...`,
    LESSON_TEMPLATE: `Genera lección: {tematica_semanal} {concepto_del_dia}`
};
