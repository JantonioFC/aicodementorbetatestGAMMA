/**
 * Code Explanation Helper
 */

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export function generateCodeExplanation(code: string, language = 'javascript', level: StudentLevel = 'beginner') {
    return {
        systemPrompt: getSystemPrompt(level),
        userPrompt: getUserPrompt(code, language),
        outputFormat: getOutputFormat()
    };
}

function getSystemPrompt(level: StudentLevel): string {
    const levelPrompts: Record<StudentLevel, string> = {
        beginner: `Eres un profesor paciente... Usa analogías del mundo real.`,
        intermediate: `Eres un mentor técnico... Enfócate en patrones de diseño.`,
        advanced: `Eres un arquitecto senior... Complejidad y performance.`
    };
    return levelPrompts[level] || levelPrompts.beginner;
}

function getUserPrompt(code: string, language: string): string {
    return `Explica el siguiente código ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nResumen, Línea por línea, Puntos de atención, Conceptos clave.`;
}

function getOutputFormat() {
    return {
        sections: [
            { id: 'summary', title: 'Resumen' },
            { id: 'lineByLine', title: 'Análisis Línea por Línea' },
            { id: 'concepts', title: 'Conceptos Clave' }
        ]
    };
}

export function generateFlowDiagram(code: string): string {
    return `## 📊 Flujo de Datos\n\n\`\`\`\nEntrada -> Proceso -> Salida\n\`\`\``;
}

const codeExplainer = {
    generateCodeExplanation,
    generateFlowDiagram
};

export default codeExplainer;
