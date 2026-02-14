
import { buildLessonPromptMessages, SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from '../../../lib/prompts/LessonPrompts';

describe('LessonPrompts', () => {
    const mockContext = {
        tematica_semanal: 'Variables',
        concepto_del_dia: 'Scope',
        texto_del_pomodoro: 'Explica el scope global'
    };

    test('buildLessonPromptMessages constructs messages with system prompt', () => {
        const messages = buildLessonPromptMessages(mockContext);
        expect(messages[0].role).toBe('system');
        expect(messages[0].content).toBe(SYSTEM_PROMPT);
    });

    test('buildLessonPromptMessages includes few-shot examples by default', () => {
        const messages = buildLessonPromptMessages(mockContext);
        // 1 System + N FewShot + 1 User
        expect(messages.length).toBeGreaterThan(2);
        expect(messages).toEqual(expect.arrayContaining(FEW_SHOT_EXAMPLES));
    });

    test('buildLessonPromptMessages can exclude few-shot examples', () => {
        const messages = buildLessonPromptMessages(mockContext, false);
        // 1 System + 1 User
        expect(messages.length).toBe(2);
        expect(messages[0].role).toBe('system');
        expect(messages[1].role).toBe('user');
    });

    test('buildLessonPromptMessages replaces variables in user prompt', () => {
        const messages = buildLessonPromptMessages(mockContext, false);
        const userContent = messages[1].content;

        expect(userContent).toContain('Tematica Semanal: Variables');
        expect(userContent).toContain('Concepto del Dia: Scope');
        expect(userContent).toContain('Tarea Especifica del Pomodoro: Explica el scope global');
    });

    test('buildLessonPromptMessages handles missing context gracefully', () => {
        const emptyContext = {};
        const messages = buildLessonPromptMessages(emptyContext, false);
        const userContent = messages[1].content;

        // Checks that placeholders are replaced by empty strings or handled, 
        // depending on implementation. The code uses `|| ''`.
        expect(userContent).toContain('Tematica Semanal: '); // Should be empty
        expect(userContent).not.toContain('undefined');
    });
});
