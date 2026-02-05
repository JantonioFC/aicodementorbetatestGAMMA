/**
 * Story-Enhanced Prompts
 * Aplica técnicas de data-storytelling a las lecciones.
 * Basado en skill: data-storytelling
 */

// Estructura narrativa para lecciones (Hook → Context → Insight → Action)
// Estructura narrativa para lecciones (Hook → Context → Insight → Action)
export const NARRATIVE_STRUCTURE = `
## Estructura de la Lección (OBLIGATORIA):

1. **🎣 HOOK (Gancho)**: Empieza con algo sorprendente o intrigante
   - Una pregunta provocadora
   - Un dato curioso
   - Un mini-misterio

2. **📚 CONTEXTO**: Establece el baseline
   - ¿Por qué importa este concepto?
   - Conexión con lo que ya saben

3. **💡 INSIGHT (Descubrimiento)**: El "aha moment"
   - La idea central explicada claramente
   - Analogía memorable

4. **🎯 ACCIÓN**: Aplicación práctica
   - Ejemplo concreto
   - Ejercicio mental
   - Quiz de verificación
`;

// Chain-of-Thought instruction
export const CHAIN_OF_THOUGHT = `
Antes de generar la lección, razona paso a paso internamente:

1. **Análisis del concepto**: ¿Cuál es la esencia del tema "{texto_del_pomodoro}"?
2. **Audiencia**: ¿Qué sabe un niño de 12 años que pueda conectar con esto?
3. **Analogía perfecta**: ¿Qué cosa cotidiana funciona igual que este concepto?
4. **Posibles confusiones**: ¿Dónde podrían surgir malentendidos?
5. **Verificación**: ¿Cómo puedo confirmar que entendieron?

Ahora, basándote en tu razonamiento, genera la lección.
`;

// Serial Position Optimization (context-window-management)
export const CONTEXT_PLACEMENT = `
**INSTRUCCIONES CRÍTICAS (PRINCIPIO):**
- Nunca uses código de programación real (printf, scanf, gcc, Python, Java)
- El estudiante tiene 12 años y aprende pensamiento computacional, NO programación
- Usa SOLO Scratch como referencia si necesitas ejemplificar

{main_content}

**RECORDATORIO FINAL (FIN):**
- Verifica que no haya código de texto
- Confirma que la analogía sea apropiada para la edad
- Asegura que el quiz tenga 4 opciones cada pregunta
`;

// Template mejorado con storytelling
export const STORYTELLING_LESSON_PROMPT = `${CHAIN_OF_THOUGHT}

${NARRATIVE_STRUCTURE}

**TEMA A ENSEÑAR:**
- Temática semanal: {tematica_semanal}
- Concepto del día: {concepto_del_dia}
- Pomodoro específico: {texto_del_pomodoro}

{student_profile}

${CONTEXT_PLACEMENT.replace('{main_content}', `
**GENERA UNA LECCIÓN QUE:**
1. Comience con un HOOK cautivador relacionado con videojuegos, deportes o situaciones escolares
2. Use UNA analogía central memorable (ej: "Los condicionales son como un semáforo...")
3. Incluya AL MENOS 2 ejemplos concretos sin código
4. Tenga secciones claras con emojis como encabezados
5. Termine con un mini-resumen de una oración
6. Incluya un quiz de 5 preguntas (4 opciones, solo 1 correcta)
`)}

**FORMATO DE RESPUESTA: JSON**
{
    "titulo": "string",
    "hook": "string (2-3 oraciones intrigantes)",
    "contenido": "string (markdown, 800-1200 palabras)",
    "analogia_principal": "string",
    "puntos_clave": ["punto1", "punto2", "punto3"],
    "quiz": [
        {
            "pregunta": "string",
            "opciones": ["a", "b", "c", "d"],
            "respuesta_correcta": 0-3,
            "explicacion": "string"
        }
    ]
}
`;

// Modificadores de personalidad basados en perfil
export const PERSONALITY_MODIFIERS = {
    visual: 'Incluye descripciones vívidas y sugiere diagramas mentales.',
    auditivo: 'Usa ritmo en las explicaciones y frases memorables.',
    kinestesico: 'Propón actividades físicas o gestos para recordar.',
    gamer: 'Usa analogías de videojuegos populares (Minecraft, Fortnite, Roblox).',
    deportista: 'Relaciona con reglas deportivas y estrategias de juego.',
    artistico: 'Conecta con creación, diseño y expresión artística.'
};

/**
 * Construye el prompt final con storytelling.
 * @param {Object} context - { tematica_semanal, concepto_del_dia, texto_del_pomodoro }
 * @param {Object} options - { studentProfile, ragContext }
 * @returns {Array<{role: string, content: string}>} Array of messages for Chat API
 */
export function buildStorytellingPromptMessages(context, options = {}) {
    let promptContent = STORYTELLING_LESSON_PROMPT
        .replace(/{tematica_semanal}/g, context.tematica_semanal || '')
        .replace(/{concepto_del_dia}/g, context.concepto_del_dia || '')
        .replace(/{texto_del_pomodoro}/g, context.texto_del_pomodoro || '');

    // Inyectar perfil del estudiante si existe
    if (options.studentProfile) {
        promptContent = promptContent.replace('{student_profile}', options.studentProfile);
    } else {
        promptContent = promptContent.replace('{student_profile}', '');
    }

    // Agregar contexto RAG si existe
    if (options.ragContext) {
        promptContent = `**CONTEXTO DE REFERENCIA:**\n${options.ragContext}\n\n---\n\n${promptContent}`;
    }

    // Return structured messages (Builder Pattern)
    return [
        { role: 'user', content: promptContent }
    ];
}

// Deprecated: Legacy single string builder
export function buildStorytellingPrompt(context, options = {}) {
    const messages = buildStorytellingPromptMessages(context, options);
    return messages[0].content;
}
