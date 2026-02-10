import { promptVersionManager } from '../../../lib/prompts/PromptVersionManager';

// Seed test versions for CI environment where .js files may not exist
beforeAll(() => {
    const versions = (promptVersionManager as any).versions as Map<string, any>;
    if (versions.size === 0) {
        versions.set('v1.0.0-base', {
            version: 'v1.0.0-base',
            description: 'Base prompt version',
            createdAt: '2024-01-01',
            SYSTEM_PROMPT: 'You are a helpful coding tutor.',
            LESSON_TEMPLATE: 'Topic: {tematica_semanal}\nConcept: {concepto_del_dia}\nPomodoro: {texto_del_pomodoro}'
        });
        versions.set('v2.0.0-storytelling', {
            version: 'v2.0.0-storytelling',
            description: 'Storytelling prompt version',
            createdAt: '2024-06-01',
            SYSTEM_PROMPT: 'You are a storytelling coding tutor.',
            LESSON_TEMPLATE: 'Story about {tematica_semanal} covering {concepto_del_dia} in {texto_del_pomodoro}'
        });
        (promptVersionManager as any).activeVersion = 'v2.0.0-storytelling';
    }
});

describe('PromptVersionManager', () => {
    test('should have active version set', () => {
        expect(promptVersionManager.getActive()).toBeDefined();
    });

    test('should list versions', () => {
        const versions = promptVersionManager.list();
        expect(versions.length).toBeGreaterThan(0);
        expect(versions[0]).toHaveProperty('version');
        expect(versions[0]).toHaveProperty('isActive');
    });

    test('should retrieve specific version', () => {
        const v1 = promptVersionManager.get('v1.0.0-base');
        expect(v1).toBeDefined();
        expect(v1?.version).toBe('v1.0.0-base');
    });

    test('should switch active version', () => {
        const original = promptVersionManager.getActive().version;

        promptVersionManager.setActive('v1.0.0-base');
        expect(promptVersionManager.getActive().version).toBe('v1.0.0-base');

        // Restore
        promptVersionManager.setActive(original);
    });

    test('should build prompt using active version', () => {
        const context = {
            tematica_semanal: 'Test Theme',
            concepto_del_dia: 'Test Concept',
            texto_del_pomodoro: 'Test Pomodoro'
        };

        const result = promptVersionManager.buildPrompt(context);

        expect(result).toHaveProperty('system');
        expect(result).toHaveProperty('prompt');
        expect(result.prompt).toContain('Test Theme');
    });

    test('should select AB variant consistently', () => {
        const userId = 'user-123';
        const variant1 = promptVersionManager.selectABVariant(userId);
        const variant2 = promptVersionManager.selectABVariant(userId);

        expect(variant1.variant).toBe(variant2.variant);
    });
});
