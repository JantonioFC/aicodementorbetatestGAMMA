import { promptVersionManager } from '../../../lib/prompts/PromptVersionManager';

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
