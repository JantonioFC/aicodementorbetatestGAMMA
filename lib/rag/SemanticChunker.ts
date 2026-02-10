/**
 * Semantic Chunker - Divide texto por límites semánticos
 * En lugar de chunks fijos, divide por oraciones y tópicos.
 */

export interface Chunk {
    text: string;
    index: number;
    metadata: any;
    type: string;
    startPosition?: number;
    endPosition?: number;
    context?: {
        before: string;
        after: string;
    };
}

export interface WeekData {
    semana: number;
    titulo_semana: string;
    tematica: string;
    objetivos?: string[];
    esquema_diario?: Array<{
        concepto: string;
        pomodoros: string[];
    }>;
}

export class SemanticChunker {
    private maxChunkSize: number;
    private minChunkSize: number;
    private overlapSize: number;
    private delimiters: RegExp[];

    constructor(options: { maxChunkSize?: number; minChunkSize?: number; overlapSize?: number } = {}) {
        this.maxChunkSize = options.maxChunkSize || 500; // caracteres
        this.minChunkSize = options.minChunkSize || 100;
        this.overlapSize = options.overlapSize || 50;

        // Delimitadores semánticos por prioridad
        this.delimiters = [
            /\n\n+/,           // Párrafos
            /\.\s+(?=[A-ZÁÉÍÓÚ])/,  // Oraciones (inicio mayúscula)
            /[;:]\s+/,         // Punto y coma, dos puntos
            /,\s+/             // Comas (último recurso)
        ];
    }

    /**
     * Divide texto en chunks semánticos.
     */
    chunk(text: string, metadata: any = {}): Chunk[] {
        if (!text || text.length <= this.maxChunkSize) {
            return [{
                text,
                index: 0,
                metadata,
                type: 'single'
            }];
        }

        const chunks: Chunk[] = [];
        let remaining = text;
        let index = 0;
        let position = 0;

        while (remaining.length > 0) {
            let chunkText: string;
            let splitPoint = this.maxChunkSize;

            if (remaining.length <= this.maxChunkSize) {
                chunkText = remaining;
                remaining = '';
            } else {
                // Buscar el mejor punto de corte semántico
                splitPoint = this._findBestSplitPoint(remaining, this.maxChunkSize);
                chunkText = remaining.substring(0, splitPoint).trim();

                // Aplicar overlap para contexto
                const overlapStart = Math.max(0, splitPoint - this.overlapSize);
                remaining = remaining.substring(overlapStart).trim();
            }

            if (chunkText.length >= this.minChunkSize) {
                chunks.push({
                    text: chunkText,
                    index,
                    startPosition: position,
                    endPosition: position + chunkText.length,
                    metadata: { ...metadata, chunkIndex: index },
                    type: this._detectChunkType(chunkText)
                });
                index++;
            }

            position += splitPoint;
        }

        return chunks;
    }

    /**
     * Encuentra el mejor punto de corte semántico.
     */
    private _findBestSplitPoint(text: string, maxLength: number): number {
        const searchWindow = text.substring(0, maxLength);

        // Buscar delimitadores en orden de prioridad
        for (const delimiter of this.delimiters) {
            const matches = [...searchWindow.matchAll(new RegExp(delimiter, 'g'))];

            if (matches.length > 0) {
                // Tomar el último match antes del límite
                const lastMatch = matches[matches.length - 1];
                const splitPoint = (lastMatch.index || 0) + lastMatch[0].length;

                // Asegurar que el chunk no sea muy pequeño
                if (splitPoint >= this.minChunkSize) {
                    return splitPoint;
                }
            }
        }

        // Fallback: cortar en el límite máximo
        return maxLength;
    }

    /**
     * Detecta el tipo de contenido del chunk.
     */
    private _detectChunkType(text: string): string {
        const lower = text.toLowerCase();

        if (/^#+\s/.test(text) || /^\*\*/.test(text)) return 'heading';
        if (/^[-*]\s/.test(text) || /^\d+\.\s/.test(text)) return 'list';
        if (/```/.test(text)) return 'code';
        if (lower.includes('ejemplo') || lower.includes('por ejemplo')) return 'example';
        if (lower.includes('quiz') || lower.includes('pregunta')) return 'quiz';

        return 'paragraph';
    }

    /**
     * Chunking especializado para currículo educativo.
     */
    chunkCurriculum(weekData: WeekData): Chunk[] {
        const chunks: Chunk[] = [];
        let globalIndex = 0;

        const weekMeta = {
            semanaId: weekData.semana,
            titulo: weekData.titulo_semana,
            tematica: weekData.tematica
        };

        // Chunk de resumen de semana
        const weekSummary = `${weekData.titulo_semana}. ${weekData.tematica}. ` +
            `Objetivos: ${(weekData.objetivos || []).join('. ')}`;

        chunks.push({
            text: weekSummary,
            index: globalIndex++,
            metadata: { ...weekMeta, type: 'week_summary' },
            type: 'summary'
        });

        // Chunks por día y pomodoro
        const esquema = weekData.esquema_diario || [];
        for (let dayIdx = 0; dayIdx < esquema.length; dayIdx++) {
            const day = esquema[dayIdx];
            const pomodoros = day.pomodoros || [];

            for (let pomIdx = 0; pomIdx < pomodoros.length; pomIdx++) {
                const pomText = pomodoros[pomIdx];

                // Chunk del pomodoro con contexto
                const contextualText = `Día ${dayIdx + 1}: ${day.concepto}. ` +
                    `Pomodoro ${pomIdx + 1}: ${pomText}`;

                chunks.push({
                    text: contextualText,
                    index: globalIndex++,
                    metadata: {
                        ...weekMeta,
                        dia: dayIdx,
                        pomodoroIndex: pomIdx,
                        concepto: day.concepto,
                        type: 'pomodoro'
                    },
                    type: 'educational'
                });
            }
        }

        return chunks;
    }

    /**
     * Añade contexto de chunks vecinos (windowing).
     */
    addContextWindow(chunks: Chunk[], windowSize: number = 1): Chunk[] {
        return chunks.map((chunk, i) => {
            const prevChunks = chunks.slice(Math.max(0, i - windowSize), i);
            const nextChunks = chunks.slice(i + 1, i + 1 + windowSize);

            return {
                ...chunk,
                context: {
                    before: prevChunks.map(c => c.text.substring(0, 100)).join(' '),
                    after: nextChunks.map(c => c.text.substring(0, 100)).join(' ')
                }
            };
        });
    }
}

// Exportar singleton
export const semanticChunker = new SemanticChunker();
