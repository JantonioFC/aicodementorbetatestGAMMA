export interface BudgetCheck {
    fits: boolean;
    estimated: number;
    available: number;
    usage: number;
}

export interface PromptComponents {
    system?: string;
    fewShot?: string;
    session?: string;
    rag?: string;
    user?: string;
}

export class TokenBudgetManager {
    private maxTokens: number;
    private reservedForOutput: number;
    private availableBudget: number;

    constructor(maxTokens = 8000, reservedForOutput = 2000) {
        this.maxTokens = maxTokens;
        this.reservedForOutput = reservedForOutput;
        this.availableBudget = maxTokens - reservedForOutput;
    }

    estimateTokens(text: string): number {
        if (!text) return 0;
        return Math.ceil(text.length / 3.5);
    }

    checkBudget(prompt: string): BudgetCheck {
        const estimated = this.estimateTokens(prompt);
        return {
            fits: estimated <= this.availableBudget,
            estimated,
            available: this.availableBudget,
            usage: Math.round((estimated / this.availableBudget) * 100)
        };
    }

    fitWithinBudget(components: PromptComponents) {
        const { system = '', fewShot = '', session = '', rag = '', user = '' } = components;
        const tokens = {
            system: this.estimateTokens(system),
            fewShot: this.estimateTokens(fewShot),
            session: this.estimateTokens(session),
            rag: this.estimateTokens(rag),
            user: this.estimateTokens(user)
        };

        const total = Object.values(tokens).reduce((a, b) => a + b, 0);
        if (total <= this.availableBudget) return { components, wasAdjusted: false, originalTokens: total, finalTokens: total };

        const adjusted = { ...components };
        let current = total;

        if (current > this.availableBudget && fewShot) {
            const target = Math.floor(this.availableBudget * 0.1);
            adjusted.fewShot = this._truncateToTokens(fewShot, target);
            current -= (tokens.fewShot - target);
        }

        if (current > this.availableBudget && rag) {
            const target = Math.floor(this.availableBudget * 0.3);
            adjusted.rag = this._truncateToTokens(rag, target);
            current -= (tokens.rag - target);
        }

        return { components: adjusted, wasAdjusted: true, originalTokens: total, finalTokens: current };
    }

    private _truncateToTokens(text: string, targetTokens: number): string {
        const chars = Math.floor(targetTokens * 3.5);
        if (text.length <= chars) return text;
        return text.substring(0, chars - 20) + '\n\n[...]';
    }
}

export const GEMINI_PRO_BUDGET = new TokenBudgetManager(30000, 4000);
export const GEMINI_FLASH_BUDGET = new TokenBudgetManager(100000, 8000);
export const DEFAULT_BUDGET = new TokenBudgetManager(8000, 2000);
