/**
 * Code Explanation Helper - AI Code Mentor
 * 
 * Skill: code-documentation-code-explain
 * Objetivo: Transformar código complejo en explicaciones claras
 * 
 * @version 1.0.0
 */

/**
 * Genera una explicación estructurada de código
 * @param {string} code - Código a explicar
 * @param {string} language - Lenguaje del código
 * @param {string} level - Nivel del estudiante (beginner|intermediate|advanced)
 * @returns {Object} Explicación estructurada
 */
export function generateCodeExplanation(code, language = 'javascript', level = 'beginner') {
    // Template para el prompt de Gemini
    return {
        systemPrompt: getSystemPrompt(level),
        userPrompt: getUserPrompt(code, language),
        outputFormat: getOutputFormat()
    };
}

function getSystemPrompt(level) {
    const levelPrompts = {
        beginner: `Eres un profesor paciente explicando código a alguien que acaba de empezar.
- Usa analogías del mundo real
- Evita jerga técnica innecesaria
- Explica cada línea como si fuera la primera vez que la ven
- Incluye "qué hace" + "por qué es importante"`,

        intermediate: `Eres un mentor técnico para desarrolladores con experiencia básica.
- Asume conocimiento de sintaxis básica
- Enfócate en patrones y decisiones de diseño
- Explica trade-offs y alternativas
- Incluye mejores prácticas`,

        advanced: `Eres un arquitecto senior haciendo code review.
- Enfócate en complejidad algorítmica y performance
- Discute edge cases y posibles bugs
- Sugiere refactorizaciones y optimizaciones
- Menciona patrones de diseño aplicables`
    };

    return levelPrompts[level] || levelPrompts.beginner;
}

function getUserPrompt(code, language) {
    return `Explica el siguiente código ${language}:

\`\`\`${language}
${code}
\`\`\`

Estructura tu respuesta así:

## 📋 Resumen (1-2 oraciones)
¿Qué hace este código en general?

## 🔍 Análisis Línea por Línea
Para cada sección importante:
- **Línea X-Y**: ¿Qué hace? ¿Por qué?

## ⚠️ Puntos de Atención
- Posibles errores o edge cases
- Cosas que podrían confundir a un principiante

## 💡 Conceptos Clave
Lista de conceptos que el estudiante debería investigar más.

## 🚀 Próximos Pasos
Qué debería practicar o aprender después.`;
}

function getOutputFormat() {
    return {
        sections: [
            { id: 'summary', title: 'Resumen', required: true },
            { id: 'lineByLine', title: 'Análisis Línea por Línea', required: true },
            { id: 'pitfalls', title: 'Puntos de Atención', required: false },
            { id: 'concepts', title: 'Conceptos Clave', required: true },
            { id: 'nextSteps', title: 'Próximos Pasos', required: false }
        ]
    };
}

/**
 * Genera un diagrama ASCII simple del flujo de datos
 * @param {string} code - Código a analizar
 * @returns {string} Diagrama ASCII
 */
export function generateFlowDiagram(code) {
    // Template simplificado para diagramas
    return `
## 📊 Flujo de Datos

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Entrada   │───▶│   Proceso   │───▶│   Salida    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                  │                  │
      ▼                  ▼                  ▼
  [Parámetros]     [Transformación]    [Resultado]
\`\`\`

*Diagrama generado automáticamente. Ajustar según el código específico.*
`;
}

/**
 * Genera preguntas de comprensión para el estudiante
 * @param {string} code - Código analizado
 * @param {number} count - Número de preguntas
 * @returns {Array} Lista de preguntas
 */
export function generateComprehensionQuestions(code, count = 3) {
    return {
        promptTemplate: `Basándote en el código anterior, genera ${count} preguntas de comprensión:

1. Una pregunta sobre QUÉ hace el código
2. Una pregunta sobre POR QUÉ se hace de esa manera
3. Una pregunta sobre CÓMO modificarlo para un caso diferente

Formato:
- **Pregunta**: [texto]
- **Pista**: [ayuda sin dar la respuesta]
- **Nivel**: [básico|intermedio|avanzado]`
    };
}

const codeExplainer = {
    generateCodeExplanation,
    generateFlowDiagram,
    generateComprehensionQuestions
};

export default codeExplainer;
