/**
 * TEMPLATES DE PROMPTS PARA GENERACIÓN DE LECCIONES
 * Refactorizado para usar External Prompts (JSON) vía PromptLoader.
 */

import { promptLoader } from './PromptLoader';

// Definir interfaz para el contexto de la lección
export interface LessonContext {
    tematica_semanal?: string;
    concepto_del_dia?: string;
    texto_del_pomodoro?: string;
    [key: string]: string | undefined; // Permitir otras propiedades opcionales para flexibilidad
}

// Interfaz para mensajes de chat (compatible con OpenAI/Gemini APIs comunes)
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Cargar prompts externos
// Nota: Se cargan síncronamente al inicio para fallar rápido si faltan archivos
const lessonPrompts = promptLoader.load('lesson.json');

// ============================================================
// 1. SYSTEM PROMPT (Persona y Comportamiento Global)
// ============================================================
export const SYSTEM_PROMPT: string = lessonPrompts.system as string;

// ============================================================
// 2. FEW-SHOT EXAMPLES (Guía de Estructura y Calidad)
// ============================================================
export const FEW_SHOT_EXAMPLES: ChatMessage[] = lessonPrompts.examples as ChatMessage[];

// ============================================================
// 3. USER PROMPT TEMPLATE (Tarea Específica con Variables)
// ============================================================
export const USER_PROMPT_TEMPLATE: string = lessonPrompts.user_template as string;

// ============================================================
// 4. BUILDER FUNCTION (Ensambla el Prompt Final)
// ============================================================
/**
 * Construye el array de mensajes para la API de Gemini.
 * @param {LessonContext} context - Contexto con las variables para el prompt
 * @param {boolean} includeFewShot - Si incluir ejemplos (default: true)
 * @returns {ChatMessage[]} Array de mensajes para la API
 */
export function buildLessonPromptMessages(context: LessonContext, includeFewShot: boolean = true): ChatMessage[] {
    // 1. Determinar el lenguaje y cargar el prompt correspondiente (scope dinámico)
    const language = context.language || '';
    let prompts;

    try {
        // Intentar cargar prompt especializado por lenguaje
        prompts = promptLoader.load('lesson.json', language, true);
    } catch (e) {
        // Fallback al genérico si falla
        prompts = lessonPrompts;
    }

    const systemPrompt = (prompts.system as string) || SYSTEM_PROMPT;
    const examples = (prompts.examples as ChatMessage[]) || FEW_SHOT_EXAMPLES;
    const userTemplate = (prompts.user_template as string) || USER_PROMPT_TEMPLATE;

    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt }
    ];

    // Agregar ejemplos opcionales
    if (includeFewShot) {
        messages.push(...examples);
    }

    // Prepara variables asegurando que sean strings
    const variables: Record<string, string> = {
        tematica_semanal: context.tematica_semanal || '',
        concepto_del_dia: context.concepto_del_dia || '',
        texto_del_pomodoro: context.texto_del_pomodoro || ''
    };

    // Agregar el prompt del usuario con variables reemplazadas utilizando el template dinámico
    const userPrompt = promptLoader.interpolate(userTemplate, variables);

    messages.push({ role: 'user', content: userPrompt });

    return messages;
}

// ============================================================
// 5. LEGACY EXPORT (Compatibilidad con código existente)
// ============================================================
// ADVERTENCIA: Esta cadena concatenada puede no estar perfectamente actualizada si cambian los JSONs
export const TEMPLATE_PROMPT_UNIVERSAL: string = `${SYSTEM_PROMPT}

${USER_PROMPT_TEMPLATE}`;
