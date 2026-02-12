/**
 * Story-Enhanced Prompts
 * Aplica técnicas de data-storytelling a las lecciones.
 */

// Estructura narrativa para lecciones
export const NARRATIVE_STRUCTURE = `
## Estructura de la Lección (OBLIGATORIA):
1. **🎣 HOOK (Gancho)**: Empieza con algo sorprendente o intrigante
2. **📚 CONTEXTO**: Establece el baseline
3. **💡 INSIGHT (Descubrimiento)**: El "aha moment"
4. **🎯 ACCIÓN**: Aplicación práctica
`;

export const CHAIN_OF_THOUGHT = `
Antes de generar la lección, razona paso a paso internamente:
1. **Análisis del concepto**: ¿Cuál es la esencia del tema?
2. **Audiencia**: ¿Qué sabe un niño de 12 años que pueda conectar con esto?
3. **Analogía perfecta**: ¿Qué cosa cotidiana funciona igual?
4. **Posibles confusiones**: ¿Dónde podrían surgir malentendidos?
`;

export const CONTEXT_PLACEMENT = `
**INSTRUCCIONES CRÍTICAS (PRINCIPIO):**
- Nunca uses código de programación real
- El estudiante tiene 12 años
- Usa SOLO Scratch como referencia

{main_content}

**RECORDATORIO FINAL (FIN):**
- Verifica que no haya código de texto
- Asegura que el quiz tenga 4 opciones
`;

export const STORYTELLING_LESSON_PROMPT = `${CHAIN_OF_THOUGHT}
${NARRATIVE_STRUCTURE}
**TEMA A ENSEÑAR:**
- Temática semanal: {tematica_semanal}
- Concepto del día: {concepto_del_dia}
- Pomodoro específico: {texto_del_pomodoro}
{student_profile}
${CONTEXT_PLACEMENT.replace('{main_content}', `
**GENERA UNA LECCIÓN QUE:**
1. Use UNA analogía central memorable
2. Incluya AL MENOS 2 ejemplos concretos
3. Termine con un quiz de 5 preguntas
`)}
**FORMATO DE RESPUESTA: JSON**
`;

export const PERSONALITY_MODIFIERS: Record<string, string> = {
    visual: 'Incluye descripciones vívidas y sugiere diagramas mentales.',
    auditivo: 'Usa ritmo en las explicaciones y frases memorables.',
    gamer: 'Usa analogías de videojuegos populares.',
    deportista: 'Relaciona con reglas deportivas.',
    artistico: 'Conecta con creación y diseño.'
};

interface StoryContext {
    tematica_semanal?: string;
    concepto_del_dia?: string;
    texto_del_pomodoro?: string;
    [key: string]: string | undefined;
}

interface StoryOptions {
    studentProfile?: string;
    ragContext?: string;
    [key: string]: string | undefined;
}

interface PromptMessage {
    role: 'user';
    content: string;
}

/**
 * Construye el prompt final con storytelling.
 */
export function buildStorytellingPromptMessages(context: StoryContext, options: StoryOptions = {}): PromptMessage[] {
    let promptContent = STORYTELLING_LESSON_PROMPT
        .replace(/{tematica_semanal}/g, context.tematica_semanal || '')
        .replace(/{concepto_del_dia}/g, context.concepto_del_dia || '')
        .replace(/{texto_del_pomodoro}/g, context.texto_del_pomodoro || '');

    if (options.studentProfile) {
        promptContent = promptContent.replace('{student_profile}', options.studentProfile);
    } else {
        promptContent = promptContent.replace('{student_profile}', '');
    }

    if (options.ragContext) {
        promptContent = `**CONTEXTO DE REFERENCIA:**\n${options.ragContext}\n\n---\n\n${promptContent}`;
    }

    return [
        { role: 'user' as const, content: promptContent }
    ];
}

export function buildStorytellingPrompt(context: StoryContext, options: StoryOptions = {}): string {
    const messages = buildStorytellingPromptMessages(context, options);
    return messages[0].content;
}
