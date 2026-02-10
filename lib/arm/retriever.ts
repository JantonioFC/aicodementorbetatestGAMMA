/**
 * ARM (Active Retrieval Module) - Retriever Component
 */

export async function fetchRawHTML(url: string): Promise<string> {
    if (!url || typeof url !== 'string') throw new Error('ARM-RETRIEVER-001: Invalid URL');
    try { new URL(url); } catch (e) { throw new Error('ARM-RETRIEVER-002: Invalid format'); }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'User-Agent': 'MentorCoder/1.0 (+https://github.com/ecosistema360)' }
        });

        if (!response.ok) {
            if (response.status === 404) throw new Error(`ARM-RETRIEVER-404: Not found at ${url}`);
            throw new Error(`ARM-RETRIEVER-HTTP: Error ${response.status}`);
        }

        const html = await response.text();
        if (!html) throw new Error('ARM-RETRIEVER-EMPTY: Empty content');
        return html;
    } catch (error: any) {
        if (error.message.startsWith('ARM-RETRIEVER-')) throw error;
        throw new Error(`ARM-RETRIEVER-NETWORK: ${error.message}`);
    }
}
