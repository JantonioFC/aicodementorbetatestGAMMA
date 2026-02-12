import * as cheerio from 'cheerio';

const MAIN_CONTENT_SELECTORS = [
    'main[role="main"]', 'main', 'article', '[role="main"]',
    '.lesson-content', '.content', 'body'
];

const NOISE_SELECTORS = [
    'script', 'style', 'nav', 'header', 'footer', '.ads', '.comments'
];

export function extractMainContent(htmlString: string): string | null {
    if (!htmlString || typeof htmlString !== 'string' || htmlString.trim().length === 0) return null;

    try {
        const $ = cheerio.load(htmlString);
        NOISE_SELECTORS.forEach(s => $(s).remove());

        let mainElement: ReturnType<typeof $> | null = null;
        for (const s of MAIN_CONTENT_SELECTORS) {
            const el = $(s);
            if (el.length > 0) {
                mainElement = el.first();
                break;
            }
        }

        if (!mainElement) mainElement = $('body');
        if (!mainElement || mainElement.length === 0) return null;

        const text = mainElement.text()
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        return text || null;
    } catch (error: unknown) {
        return null;
    }
}

interface ExtractionStats {
    success: boolean;
    textLength: number;
    wordCount?: number;
    lineCount?: number;
}

export function getExtractionStats(htmlString: string): ExtractionStats {
    const content = extractMainContent(htmlString);
    if (!content) return { success: false, textLength: 0 };
    return {
        success: true,
        textLength: content.length,
        wordCount: content.split(/\s+/).length,
        lineCount: content.split('\n').length
    };
}
