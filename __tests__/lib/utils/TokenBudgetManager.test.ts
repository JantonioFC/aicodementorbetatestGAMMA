import { TokenBudgetManager, GEMINI_PRO_BUDGET } from '../../../lib/utils/TokenBudgetManager';

describe('TokenBudgetManager', () => {
    let manager: TokenBudgetManager;

    beforeEach(() => {
        manager = new TokenBudgetManager(1000, 200); // 800 available
    });

    describe('estimateTokens', () => {
        test('returns 0 for empty text', () => {
            expect(manager.estimateTokens('')).toBe(0);
            expect(manager.estimateTokens(null as any)).toBe(0);
        });

        test('estimates tokens based on character count', () => {
            const text = 'a'.repeat(350); // 350 chars ≈ 100 tokens
            const estimated = manager.estimateTokens(text);
            expect(estimated).toBe(100);
        });
    });

    describe('checkBudget', () => {
        test('returns fits=true when under budget', () => {
            const shortText = 'Hello world';
            const result = manager.checkBudget(shortText);
            expect(result.fits).toBe(true);
        });

        test('returns fits=false when over budget', () => {
            const longText = 'a'.repeat(3500); // ~1000 tokens, over 800 available
            const result = manager.checkBudget(longText);
            expect(result.fits).toBe(false);
        });
    });

    describe('fitWithinBudget', () => {
        test('returns unchanged components when under budget', () => {
            const components = {
                system: 'System prompt',
                fewShot: 'Example',
                session: 'Session',
                rag: 'RAG context',
                user: 'User prompt'
            };

            const result = manager.fitWithinBudget(components);
            expect(result.wasAdjusted).toBe(false);
            expect(result.components).toEqual(components);
        });

        test('truncates fewShot first when over budget', () => {
            const longFewShot = 'a'.repeat(3500);
            const components = {
                system: 'System',
                fewShot: longFewShot,
                session: '',
                rag: '',
                user: 'User prompt'
            };

            const result = manager.fitWithinBudget(components);
            expect(result.wasAdjusted).toBe(true);
            expect(result.components.fewShot.length).toBeLessThan(longFewShot.length);
        });
    });
});

describe('Preset Budgets', () => {
    test('GEMINI_PRO_BUDGET has correct configuration', () => {
        expect(GEMINI_PRO_BUDGET.maxTokens).toBe(30000);
        expect(GEMINI_PRO_BUDGET.reservedForOutput).toBe(4000);
        expect(GEMINI_PRO_BUDGET.availableBudget).toBe(26000);
    });
});
