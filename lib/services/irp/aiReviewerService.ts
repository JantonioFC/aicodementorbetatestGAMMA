import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Configuración del modelo
const GEMINI_CONFIG = {
    model: 'models/gemini-2.5-flash',
    generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
    }
};

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

export function initializeAI(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return false;

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel(GEMINI_CONFIG);
        return true;
    } catch (error) {
        return false;
    }
}

function generateReviewPrompt(reviewRequest: any, codeContent: string): string {
    const {
        project_name,
        phase,
        week,
        description,
        learning_objectives = [],
        specific_focus = []
    } = reviewRequest;

    return `Eres un AUDITOR DE CÓDIGO experto de "AI Code Mentor".
Contexto: Fase ${phase} (Semana ${week}) - ${project_name}
Código:
\`\`\`
${codeContent}
\`\`\`
Instrucciones: Genera informe JSON con puntos_fuertes, sugerencias_mejora (prioridad baja/media/alta), preguntas_reflexion, calificacion_general (1-5), tiempo_revision_horas, recomendacion (APPROVE/MAJOR_REVISION_NEEDED) y mensaje_tutor.`;
}

export function validateReviewStructure(reviewData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!reviewData.puntos_fuertes || !Array.isArray(reviewData.puntos_fuertes)) errors.push('puntos_fuertes debe ser un array');
    if (!reviewData.sugerencias_mejora || !Array.isArray(reviewData.sugerencias_mejora)) errors.push('sugerencias_mejora debe ser un array');
    return { isValid: errors.length === 0, errors };
}

export async function performAIReview(reviewRequest: any, passedCodeContent: string | null = null): Promise<any> {
    const startTime = Date.now();
    try {
        if (!model) initializeAI();
        if (!model) throw new Error('No AI Model');

        const codeToReview = passedCodeContent || reviewRequest.code_content;
        if (!codeToReview) throw new Error('No code content');

        const prompt = generateReviewPrompt(reviewRequest, codeToReview);
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let reviewData: any;
        try {
            let cleanedText = text.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            reviewData = JSON.parse(cleanedText);
        } catch (e) {
            throw new Error('Invalid JSON from AI');
        }

        const validation = validateReviewStructure(reviewData);
        if (!validation.isValid) throw new Error(`Invalid Structure: ${validation.errors.join(', ')}`);

        return {
            success: true,
            reviewData,
            metadata: { duration: Date.now() - startTime, model: GEMINI_CONFIG.model, timestamp: new Date().toISOString() }
        };
    } catch (error: any) {
        throw error;
    }
}

export function isAIAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
}
