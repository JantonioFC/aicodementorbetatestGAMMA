/**
 * API Endpoint: POST /api/v1/multimodal/diagram
 * Genera un diagrama Mermaid para un concepto.
 */

import { diagramGenerator } from '../../../../lib/multimodal/DiagramGenerator';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { concept, type = 'flowchart' } = req.body;

        if (!concept) {
            return res.status(400).json({
                success: false,
                error: 'concept is required'
            });
        }

        const diagram = diagramGenerator.generateForConcept(concept, type);

        res.status(200).json({
            success: true,
            diagram,
            concept,
            type
        });
    } catch (error) {
        console.error('[API] Error generating diagram:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
