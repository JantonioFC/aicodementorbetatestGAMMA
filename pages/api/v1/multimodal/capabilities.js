/**
 * API Endpoint: GET /api/v1/multimodal/capabilities
 * Retorna las capacidades multimodales disponibles.
 */

import { multimodalService } from '../../../../lib/multimodal/MultimodalService';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const capabilities = multimodalService.getCapabilities();

        res.status(200).json({
            success: true,
            capabilities
        });
    } catch (error) {
        console.error('[API] Error getting capabilities:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
