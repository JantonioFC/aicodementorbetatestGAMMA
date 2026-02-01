/**
 * API Endpoint: POST /api/v1/tts/synthesize
 * Genera audio a partir de texto.
 */

import { textToSpeechService } from '../../../../lib/multimodal/TextToSpeechService';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, provider = 'fal', voice } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'text is required'
            });
        }

        // Si el texto es muy largo, retornar script para browser
        if (text.length > 5000) {
            const chunks = textToSpeechService.splitIntoChunks(text);
            const browserScript = textToSpeechService.generateBrowserScript(text);

            return res.status(200).json({
                success: true,
                provider: 'browser',
                chunks: chunks.length,
                browserScript,
                note: 'Text too long for API, use browser fallback'
            });
        }

        const result = await textToSpeechService.synthesize(text, { provider, voice });

        res.status(200).json({
            success: result.success,
            ...result
        });
    } catch (error) {
        console.error('[API] Error synthesizing speech:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
