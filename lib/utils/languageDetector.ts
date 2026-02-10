export interface LanguageDetectionResult {
    language: string;
    confidence: number;
    displayName: string;
}

const LANGUAGE_PATTERNS: Record<string, { patterns: RegExp[]; weight: number }> = {
    javascript: {
        patterns: [/\bconst\s+\w+\s*=/, /\blet\s+\w+\s*=/, /=>\s*[{(]/, /\bfunction\s+\w+\s*\(/],
        weight: 1
    },
    typescript: {
        patterns: [/:\s*(string|number|any|void)\b/, /\binterface\s+\w+\s*\{/, /\btype\s+\w+\s*=/],
        weight: 1.2
    },
    python: {
        patterns: [/\bdef\s+\w+\s*\(/, /\bclass\s+\w+(\s*\(.*\))?:/, /\bimport\s+\w+/, /\bself\./],
        weight: 1
    },
    // ... más patrones omitidos para brevedad en el plan, se incluirán todos en el archivo final
};

const LANGUAGE_NAMES: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    // ...
};

export function detectLanguage(code: string): LanguageDetectionResult {
    if (!code || typeof code !== 'string') return { language: 'javascript', confidence: 0, displayName: 'JavaScript' };

    const scores: Record<string, number> = {};
    for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
        let score = 0;
        let matches = 0;
        for (const pattern of config.patterns) {
            if (pattern.test(code)) {
                score += config.weight;
                matches++;
            }
        }
        scores[lang] = config.patterns.length > 0 ? (score / config.patterns.length) * matches : 0;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [topLang, topScore] = sorted[0] || ['javascript', 0];
    const [, secondScore] = sorted[1] || ['unknown', 0];

    const confidence = topScore > 0 ? Math.min(1, (topScore - secondScore) / topScore + 0.3) : 0;

    return {
        language: topLang,
        confidence: Math.round(confidence * 100) / 100,
        displayName: LANGUAGE_NAMES[topLang] || topLang
    };
}

export function getLanguageName(langCode: string): string {
    return LANGUAGE_NAMES[langCode?.toLowerCase()] || langCode || 'Unknown';
}
