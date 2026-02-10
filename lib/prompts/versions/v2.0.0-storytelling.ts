import { PromptVersion } from './v1.0.0-base';

export const v200Storytelling: PromptVersion = {
    version: 'v2.0.0-storytelling',
    description: 'Estructura narrativa completa + multimodal',
    createdAt: '2026-02-01',
    SYSTEM_PROMPT: `Eres un tutor experto... Hook -> Context -> Insight -> Action`,
    LESSON_TEMPLATE: `Razona... Hook... Context... Insight... Action... {tematica_semanal}`,
    supportsMultimodal: true
};
