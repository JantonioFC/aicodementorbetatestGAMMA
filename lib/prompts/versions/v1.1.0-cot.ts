import { PromptVersion } from './v1.0.0-base';

export const v110Cot: PromptVersion = {
    version: 'v1.1.0-cot',
    description: 'Chain-of-Thought para mejor razonamiento',
    createdAt: '2026-02-01',
    SYSTEM_PROMPT: `Eres un tutor experto... Razona paso a paso.`,
    CHAIN_OF_THOUGHT: `Antes de generar, razona: 1. Concepto... 2. Analogía...`,
    LESSON_TEMPLATE: `{CHAIN_OF_THOUGHT}\n\nGenera lección: {tematica_semanal} {concepto_del_dia}`
};
