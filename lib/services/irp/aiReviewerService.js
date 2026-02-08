/**
 * AI Reviewer Service - IRP Integration
 * 
 * Integración con Gemini para revisiones automatizadas de código.
 * Adaptado del microservicio IRP para uso con Supabase.
 * 
 * @author Mentor Coder
 * @version 2.0.0 (Supabase Integration)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

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

let genAI = null;
let model = null;

/**
 * Inicializa el cliente de Gemini AI
 */
export function initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[IRP-AI] Gemini API Key no configurada');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel(GEMINI_CONFIG);
        console.log('[IRP-AI] Cliente de Gemini inicializado');
        return true;
    } catch (error) {
        console.error('[IRP-AI] Error inicializando Gemini:', error.message);
        return false;
    }
}

/**
 * Genera el prompt para la revisión de código (Auditoría Curricular)
 */
function generateReviewPrompt(reviewRequest, codeContent) {
    const {
        project_name,
        phase,
        week,
        description,
        learning_objectives = [],
        specific_focus = []
    } = reviewRequest;

    return `Eres un AUDITOR DE CÓDIGO experto de "AI Code Mentor", un bien público digital educativo. 

Tu misión es realizar una AUDITORÍA INTEGRAL del código de un estudiante para asegurar que cumple con los estándares industriales y los objetivos de la fase actual del currículum.

**CONTEXTO CURRICULAR:**
- Fase del curso: ${phase} (Semana ${week})
- Proyecto: ${project_name}
- Tarea/Módulo: ${description}
- Estándares a Evaluar (Objetivos): ${learning_objectives.join(', ')}
- Áreas de interés del estudiante: ${specific_focus.join(', ')}

**CÓDIGO A AUDITAR:**
\`\`\`
${codeContent}
\`\`\`

**INSTRUCCIONES DE AUDITORÍA:**
Genera un informe detallado, educativo y profesional en formato JSON. Tu tono debe ser el de un mentor senior: exigente pero motivador.

Estructura del JSON:
{
  "puntos_fuertes": [
    {
      "categoria": "string (ej: 'Clean Code', 'Seguridad', 'Rendimiento')",
      "descripcion": "string (Por qué esto es un acierto bajo estándares industriales)",
      "archivo_referencia": "string (nombre opcional)",
      "linea_referencia": number
    }
  ],
  "sugerencias_mejora": [
    {
      "categoria": "string",
      "descripcion": "Explicación clara de QUÉ mejorar y por qué es importante según el currículum",
      "archivo_referencia": "string",
      "linea_referencia": number,
      "prioridad": "string ('baja', 'media', 'alta')"
    }
  ],
  "preguntas_reflexion": [
    {
      "pregunta": "Una pregunta socrática que invite al alumno a profundizar en el 'por qué' de su solución",
      "contexto": "Breve explicación de la relevancia de esta duda"
    }
  ],
  "calificacion_general": {
    "claridad_codigo": number (1-5),
    "arquitectura": number (1-5),
    "testing": number (1-5),
    "documentacion": number (1-5)
  },
  "tiempo_revision_horas": number,
  "recomendacion": "string ('APPROVE', 'APPROVE_WITH_MINOR_CHANGES', o 'MAJOR_REVISION_NEEDED')",
  "mensaje_tutor": "string (Un mensaje final motivador y resumen de la auditoría)"
}

**ESTÁNDARES DE CALIDAD:**
1. Sé específico y técnico. Evita generalidades.
2. Si el código no cumple con los objetivos de aprendizaje (${learning_objectives.join(', ')}), indica 'MAJOR_REVISION_NEEDED'.
3. Proporciona ejemplos cortos de cómo se vería la mejora si es posible (en la descripción).
4. Asegúrate de que el JSON sea estrictamente válido.`;
}

/**
 * Valida la estructura de una revisión generada por IA
 */
export function validateReviewStructure(reviewData) {
    const errors = [];

    if (!reviewData.puntos_fuertes || !Array.isArray(reviewData.puntos_fuertes)) {
        errors.push('puntos_fuertes debe ser un array');
    } else if (reviewData.puntos_fuertes.length < 1) {
        errors.push('Debe haber al menos 1 punto fuerte');
    }

    if (!reviewData.sugerencias_mejora || !Array.isArray(reviewData.sugerencias_mejora)) {
        errors.push('sugerencias_mejora debe ser un array');
    } else if (reviewData.sugerencias_mejora.length < 1) {
        errors.push('Debe haber al menos 1 sugerencia de mejora');
    }

    if (!reviewData.preguntas_reflexion || !Array.isArray(reviewData.preguntas_reflexion)) {
        errors.push('preguntas_reflexion debe ser un array');
    }

    if (!reviewData.calificacion_general) {
        errors.push('calificacion_general es requerida');
    } else {
        const ratings = ['claridad_codigo', 'arquitectura', 'testing', 'documentacion'];
        ratings.forEach(r => {
            const value = reviewData.calificacion_general[r];
            if (!value || value < 1 || value > 5) {
                errors.push(`${r} debe ser un número entre 1 y 5`);
            }
        });
    }

    if (!reviewData.tiempo_revision_horas || reviewData.tiempo_revision_horas < 0.1) {
        errors.push('tiempo_revision_horas debe ser mayor a 0.1');
    }

    const validRecs = ['APPROVE', 'APPROVE_WITH_MINOR_CHANGES', 'MAJOR_REVISION_NEEDED'];
    if (!reviewData.recomendacion || !validRecs.includes(reviewData.recomendacion)) {
        errors.push('recomendacion debe ser: APPROVE, APPROVE_WITH_MINOR_CHANGES o MAJOR_REVISION_NEEDED');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Realiza una revisión de código utilizando Gemini AI
 */
export async function performAIReview(reviewRequest, passedCodeContent = null) {
    const startTime = Date.now();

    try {
        if (!model) {
            const initialized = initializeAI();
            if (!initialized) {
                throw new Error('No se pudo inicializar Gemini AI');
            }
        }

        // Determinar el código a revisar (Prioridad: Inyectado > Request code_content > GitHub)
        let codeToReview = passedCodeContent || reviewRequest.code_content;

        if (!codeToReview && reviewRequest.github_repo_url) {
            console.log('[IRP-AI] Fetching code from GitHub...', reviewRequest.github_repo_url);
            codeToReview = await fetchCodeFromGitHub(reviewRequest.github_repo_url);
        }

        if (!codeToReview) {
            throw new Error('No hay contenido de código para auditar');
        }

        console.log('[IRP-AI] Iniciando auditoría curricular', {
            requestId: reviewRequest.id,
            projectName: reviewRequest.project_name
        });

        const prompt = generateReviewPrompt(reviewRequest, codeToReview);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parsear respuesta JSON
        let reviewData;
        try {
            let cleanedText = text.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/```\n?/g, '');
            }
            reviewData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('[IRP-AI] Error parseando respuesta:', parseError.message);
            throw new Error('La respuesta de la IA no pudo ser parseada como JSON válido');
        }

        // Validar estructura
        const validation = validateReviewStructure(reviewData);
        if (!validation.isValid) {
            console.error('[IRP-AI] Estructura inválida:', validation.errors);
            throw new Error(`Estructura de revisión inválida: ${validation.errors.join(', ')}`);
        }

        const duration = Date.now() - startTime;

        console.log('[IRP-AI] Revisión completada', {
            requestId: reviewRequest.id,
            duration: `${duration}ms`,
            puntosFuertes: reviewData.puntos_fuertes.length
        });

        return {
            success: true,
            reviewData,
            metadata: {
                duration,
                model: GEMINI_CONFIG.model,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('[IRP-AI] Error en revisión:', error.message, { duration });
        throw error;
    }
}

/**
 * Obtiene el contenido del código desde GitHub
 * @param {string} githubRepoUrl - URL del repositorio
 * @returns {Promise<string>} Contenido del código
 */
export async function fetchCodeFromGitHub(githubRepoUrl) {
    // TODO: Implementar integración real con GitHub API
    console.warn('[IRP-AI] GitHub integration pending - using sample code');

    return `// Código del repositorio
// ${githubRepoUrl}
function main() {
  console.log('Sample code from repository');
}
main();`;
}

/**
 * Verifica si el servicio de IA está disponible
 */
export function isAIAvailable() {
    return !!process.env.GEMINI_API_KEY;
}
