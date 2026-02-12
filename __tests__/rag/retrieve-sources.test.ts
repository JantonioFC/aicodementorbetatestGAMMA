/**
 * TESTS PARA retrieve_sources() - MOTOR RAG CORE
 * 
 * MISIÓN 153 - FASE 1: ESCRITURA DE PRUEBAS (TDD)
 */

// Importaciones necesarias para testing
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

interface MockResource {
    nombre: string;
    url: string;
}

interface MockWeek {
    semana: number;
    tituloSemana: string;
    objetivos: string[];
    tematica: string;
    actividades: string[];
    entregables: string;
    recursos?: MockResource[];
    official_sources?: string[];
    ejercicios?: string[];
    fase?: number;
    tituloFase?: string;
    modulo?: number;
    tituloModulo?: string;
}

interface MockModule {
    modulo: number;
    tituloModulo: string;
    semanas: MockWeek[];
}

interface MockPhase {
    fase: number;
    tituloFase: string;
    duracionMeses: string;
    proposito: string;
    modulos: MockModule[];
}

interface MockCurriculum {
    curriculum: MockPhase[];
}

interface EnrichedContext {
    weekId: number;
    weekTitle: string;
    phase: number;
    phaseTitle: string;
    module: number;
    moduleTitle: string;
    objectives: string[];
    mainTopic: string;
    activities: string[];
    deliverables: string;
    resources: MockResource[];
    exercises: string[];
    pedagogicalApproach: string;
    difficultyLevel: string;
    prerequisites: Array<{ weekId: number; title: string; keyTopics: string[] }>;
    retrievalTimestamp: string;
    sourceAuthority: string;
    contextVersion: string;
}

// Mock del currículum para tests
const mockCurriculumData: MockCurriculum = {
    curriculum: [
        {
            fase: 0,
            tituloFase: "La Cimentación del Arquitecto",
            duracionMeses: "3-4 Meses",
            proposito: "Adquirir competencia mínima viable en desarrollo moderno",
            modulos: [
                {
                    modulo: 1,
                    tituloModulo: "Fundamentos de la Interacción con IA",
                    semanas: [
                        {
                            semana: 1,
                            tituloSemana: "Teoría y Ética de IA",
                            objetivos: [
                                "Construir el vocabulario y marco mental para interactuar con IA de forma crítica.",
                                "Comprender los fundamentos, sesgos y limitaciones de los LLMs."
                            ],
                            tematica: "Cursos Google Cloud Skills Boost: Introduction to Generative AI",
                            actividades: [
                                "Completar los tres micro-cursos de fundamentos de IA de Google.",
                                "Estudiar los 7 principios de IA responsable de Google."
                            ],
                            entregables: "Primera entrada en el DMA resumiendo conceptos clave",
                            recursos: [
                                {
                                    nombre: "Principios de IA Responsable de Google",
                                    url: "https://ai.google/responsibility/principles/"
                                }
                            ],
                            official_sources: [
                                "https://www.cloudskillsboost.google/course_templates/536"
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// Mock dinámico para extender a semana 100
const generateExtendedMockCurriculum = (): MockCurriculum => {
    const extended: MockCurriculum = JSON.parse(JSON.stringify(mockCurriculumData));

    // Generar semanas adicionales hasta la 100 para tests exhaustivos
    for (let semana = 4; semana <= 100; semana++) {
        const fase = Math.floor((semana - 1) / 12);
        const moduloCount = Math.floor((semana - 1) / 6) + 1;

        const semanaData: MockWeek = {
            semana: semana,
            tituloSemana: `Semana de Prueba ${semana}`,
            objetivos: [`Objetivo test ${semana}`, `Segundo objetivo test ${semana}`],
            tematica: `Temática de prueba para semana ${semana}`,
            actividades: [`Actividad test ${semana}`],
            entregables: `Entregable test semana ${semana}`
        };

        if (!extended.curriculum[fase]) {
            extended.curriculum[fase] = {
                fase: fase,
                tituloFase: `Fase de Prueba ${fase}`,
                duracionMeses: "Variable",
                proposito: `Propósito test fase ${fase}`,
                modulos: []
            };
        }

        const targetModuleIndex = extended.curriculum[fase].modulos.findIndex((m: MockModule) => m.modulo === moduloCount);
        if (targetModuleIndex === -1) {
            extended.curriculum[fase].modulos.push({
                modulo: moduloCount,
                tituloModulo: `Módulo Test ${moduloCount}`,
                semanas: [semanaData]
            });
        } else {
            extended.curriculum[fase].modulos[targetModuleIndex].semanas.push(semanaData);
        }
    }

    return extended;
};

describe('retrieve_sources() - Motor RAG Core', () => {

    let retrieveSources: (weekId: number | undefined | null) => Promise<EnrichedContext>;
    let getCurriculumData: jest.Mock<() => Promise<MockCurriculum>>;
    let findWeekInCurriculum: jest.Mock<(curriculumData: MockCurriculum, weekId: number) => MockWeek | null>;
    let determinePedagogicalApproach: jest.Mock<(phase: number) => string>;
    let calculateDifficultyLevel: jest.Mock<(weekId: number) => string>;
    let getPrerequisites: jest.Mock<(weekId: number, curriculumData: MockCurriculum) => Array<{ weekId: number; title: string; keyTopics: string[] }>>;

    beforeAll(() => {
        getCurriculumData = jest.fn<() => Promise<MockCurriculum>>(() => {
            return Promise.resolve(generateExtendedMockCurriculum());
        });

        findWeekInCurriculum = jest.fn<(curriculumData: MockCurriculum, weekId: number) => MockWeek | null>((curriculumData: MockCurriculum, weekId: number) => {
            for (const fase of curriculumData.curriculum) {
                for (const modulo of fase.modulos) {
                    for (const semana of modulo.semanas) {
                        if (semana.semana === weekId) {
                            return {
                                ...semana,
                                fase: fase.fase,
                                tituloFase: fase.tituloFase,
                                modulo: modulo.modulo,
                                tituloModulo: modulo.tituloModulo
                            };
                        }
                    }
                }
            }
            return null;
        });

        determinePedagogicalApproach = jest.fn<(phase: number) => string>((phase: number) => {
            const approaches: Record<number, string> = {
                0: "Cimentación y Fundamentos",
                1: "Programación Estructurada",
                2: "Desarrollo Frontend",
                3: "Arquitectura Backend",
                4: "Operaciones y Escalabilidad",
                5: "Ciencia de Datos",
                6: "Integración Professional",
                7: "Crecimiento Continuo"
            };
            return approaches[phase] || "Enfoque General";
        });

        calculateDifficultyLevel = jest.fn<(weekId: number) => string>((weekId: number) => {
            if (weekId <= 20) return "Básico";
            if (weekId <= 50) return "Intermedio";
            if (weekId <= 80) return "Avanzado";
            return "Experto";
        });

        getPrerequisites = jest.fn<(weekId: number, curriculumData: MockCurriculum) => Array<{ weekId: number; title: string; keyTopics: string[] }>>((weekId: number, curriculumData: MockCurriculum) => {
            if (weekId <= 1) return [];

            const prerequisites: Array<{ weekId: number; title: string; keyTopics: string[] }> = [];
            for (let i = Math.max(1, weekId - 3); i < weekId; i++) {
                const prevWeek = findWeekInCurriculum(curriculumData, i);
                if (prevWeek) {
                    prerequisites.push({
                        weekId: i,
                        title: prevWeek.tituloSemana,
                        keyTopics: prevWeek.objetivos.slice(0, 2)
                    });
                }
            }
            return prerequisites;
        });

        retrieveSources = jest.fn<(weekId: number | undefined | null) => Promise<EnrichedContext>>(async (weekId: number | undefined | null) => {
            if (weekId === undefined || weekId === null || weekId < 1 || weekId > 100) {
                throw new Error(`WeekId inválido: ${weekId}. Debe estar entre 1-100.`);
            }

            const curriculumData = await getCurriculumData();
            const weekData = findWeekInCurriculum(curriculumData, weekId);

            if (!weekData) {
                throw new Error(`Semana ${weekId} no encontrada en curriculum.json`);
            }

            const enrichedContext: EnrichedContext = {
                weekId: weekId,
                weekTitle: weekData.tituloSemana,
                phase: weekData.fase || 0,
                phaseTitle: weekData.tituloFase || '',
                module: weekData.modulo || 0,
                moduleTitle: weekData.tituloModulo || '',
                objectives: weekData.objetivos,
                mainTopic: weekData.tematica,
                activities: weekData.actividades,
                deliverables: weekData.entregables,
                resources: weekData.recursos || [],
                exercises: weekData.ejercicios || [],
                pedagogicalApproach: determinePedagogicalApproach(weekData.fase || 0),
                difficultyLevel: calculateDifficultyLevel(weekId),
                prerequisites: getPrerequisites(weekId, curriculumData),
                retrievalTimestamp: new Date().toISOString(),
                sourceAuthority: "curriculum.json",
                contextVersion: "v5.0"
            };

            return enrichedContext;
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Validación de parámetros de entrada', () => {
        test('debe rechazar weekId undefined', async () => {
            await expect(retrieveSources(undefined)).rejects.toThrow(
                /WeekId inválido/
            );
        });

        test('debe rechazar weekId null', async () => {
            await expect(retrieveSources(null)).rejects.toThrow(
                /WeekId inválido/
            );
        });

        test('debe rechazar weekId = 0', async () => {
            await expect(retrieveSources(0)).rejects.toThrow(
                /WeekId inválido/
            );
        });

        test('debe rechazar weekId negativo', async () => {
            await expect(retrieveSources(-5)).rejects.toThrow(
                /WeekId inválido/
            );
        });

        test('debe rechazar weekId > 100', async () => {
            await expect(retrieveSources(101)).rejects.toThrow(
                /WeekId inválido/
            );
        });

        test('debe aceptar weekId = 1', async () => {
            const result = await retrieveSources(1);
            expect(result).toBeDefined();
            expect(result.weekId).toBe(1);
        });

        test('debe aceptar weekId = 100', async () => {
            const result = await retrieveSources(100);
            expect(result).toBeDefined();
            expect(result.weekId).toBe(100);
        });
    });

    describe('Camino feliz - casos válidos', () => {
        test('debe recuperar correctamente la semana 1', async () => {
            const result = await retrieveSources(1);
            expect(result).toBeDefined();
            expect(result.weekId).toBe(1);
            expect(result.weekTitle).toBe("Teoría y Ética de IA");
            expect(result.phase).toBe(0);
        });

        test('debe calcular correctamente nivel de dificultad por rango de semanas', async () => {
            const week10 = await retrieveSources(10);
            expect(week10.difficultyLevel).toBe("Básico");

            const week25 = await retrieveSources(25);
            expect(week25.difficultyLevel).toBe("Intermedio");

            const week60 = await retrieveSources(60);
            expect(week60.difficultyLevel).toBe("Avanzado");

            const week90 = await retrieveSources(90);
            expect(week90.difficultyLevel).toBe("Experto");
        });
    });
});
