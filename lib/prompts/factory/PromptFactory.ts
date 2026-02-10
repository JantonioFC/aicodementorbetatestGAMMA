import path from 'path';
import { promptLoader } from '../PromptLoader';
import { logger } from '../../utils/logger';

export interface PromptContext {
    phase: string;
    language: string;
    analysisType: string;
    code: string;
    domain?: string;
    customVariables?: Record<string, string>;
}

export interface BuiltPrompt {
    system: string;
    user: string;
    constraints: any;
    domain: string;
}

export class PromptFactory {
    private constraintsCache: any = null;

    /**
     * Construir prompt completo para una consulta
     */
    buildPrompt(context: PromptContext): BuiltPrompt {
        const { phase, language, analysisType, code, domain = 'programming', customVariables = {} } = context;

        // 1. Cargar Instrucciones Base (System Persona)
        const systemTemplate = this.loadSystemTemplate(phase, language, analysisType);

        // 2. Cargar Restricciones (Constraints)
        const constraints = this.loadConstraints(phase, language);

        // 3. Ensamblar System Prompt
        const systemPrompt = promptLoader.interpolate(systemTemplate, {
            language: this.getLanguageDisplayName(language),
            phase: phase,
            analysisType: analysisType || 'general',
            ...customVariables
        });

        // 4. Ensamblar User Prompt (basado en el tipo de análisis)
        const userPrompt = this.buildUserPrompt(code, language, analysisType, constraints);

        return {
            system: systemPrompt,
            user: userPrompt,
            constraints,
            domain
        };
    }

    private loadSystemTemplate(phase: string, language: string, analysisType: string): string {
        // Intentar cargar desde external/lang/analysisType.json
        try {
            const externalPrompt = promptLoader.load(`${analysisType}.json`, language, true);
            if (externalPrompt?.system) return externalPrompt.system;
        } catch (e) {
            // Silencio - Fallback a default
        }

        // Fallback robusto por fase
        const fallbacks: Record<string, string> = {
            'fase-0': 'Eres un tutor muy paciente que enseña {{language}} a principiantes completos en {{phase}}.',
            'fase-1': 'Eres un asistente educativo que guía en fundamentos de {{language}} en {{phase}}.',
            'fase-5': 'Eres un mentor senior que ayuda con arquitectura avanzada de {{language}} en {{phase}}.'
        };

        return fallbacks[phase] || fallbacks['fase-1'];
    }

    private loadConstraints(phase: string, language: string): any {
        // Cargar constraints globales por fase (default)
        if (!this.constraintsCache) {
            try {
                this.constraintsCache = promptLoader.load('by-phase.json', 'constraints', true);
            } catch (e) {
                logger.warn('[PromptFactory] Fallback de constraints activado');
                this.constraintsCache = this.getDefaultConstraints();
            }
        }

        const baseConstraints = this.constraintsCache[phase] || this.constraintsCache['default'];

        // Intentar override por lenguaje (e.g., rust/constraints.json)
        try {
            const langOverrides = promptLoader.load('constraints.json', language, true);
            return { ...baseConstraints, ...langOverrides };
        } catch (e) {
            return baseConstraints;
        }
    }

    private buildUserPrompt(code: string, language: string, analysisType: string, constraints: any): string {
        const langName = this.getLanguageDisplayName(language);

        // Manejo de Slash Commands o Tipos Especiales
        if (analysisType === 'test_generation') {
            return `Genera una suite de unit tests para el siguiente código ${langName} siguiendo las convenciones de la industria:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        }

        if (analysisType === 'doc_generation') {
            return `Genera documentación técnica (docstrings/comments) profesional para el siguiente código ${langName}:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        }

        // Prompt General de Análisis
        const parts = [
            `Analiza el siguiente código ${langName}:`,
            '',
            `\`\`\`${language}`,
            code,
            `\`\`\``,
            ''
        ];

        if (constraints.avoidConcepts?.length > 0) {
            parts.push(`**Evitar:** ${constraints.avoidConcepts.join(', ')}`);
        }

        if (constraints.encourageConcepts?.length > 0) {
            parts.push(`**Enfatizar:** ${constraints.encourageConcepts.join(', ')}`);
        }

        parts.push('\nResponde en JSON con esta estructura:');
        parts.push(JSON.stringify(constraints.responseFormat || { feedback: 'string' }, null, 2));

        return parts.join('\n');
    }

    private getLanguageDisplayName(code: string): string {
        const names: Record<string, string> = {
            'js': 'JavaScript',
            'javascript': 'JavaScript',
            'ts': 'TypeScript',
            'typescript': 'TypeScript',
            'py': 'Python',
            'python': 'Python',
            'rs': 'Rust',
            'rust': 'Rust',
            'go': 'Go'
        };
        return names[code?.toLowerCase()] || code || 'JavaScript';
    }

    private getDefaultConstraints() {
        return {
            'default': {
                maxComplexitySuggestions: 3,
                avoidConcepts: [],
                encourageConcepts: ['clean code', 'best practices'],
                responseFormat: { feedback: 'string', strengths: ['string'], improvements: ['string'] }
            }
        };
    }
}

export const promptFactory = new PromptFactory();
