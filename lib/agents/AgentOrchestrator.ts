import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent';
import { PedagogyAgent } from './PedagogyAgent';
import { TechnicalAgent } from './TechnicalAgent';
import { SupportAgent } from './SupportAgent';
import { logger } from '../utils/logger';

/**
 * Agent Orchestrator - El cerebro del sistema multi-agente.
 * Coordina agentes especializados para producir una respuesta final enriquecida.
 */
export class AgentOrchestrator {
    private agents: BaseAgent[] = [];

    constructor() {
        // Registro por defecto de agentes core
        this.registerAgent(new PedagogyAgent());
        this.registerAgent(new TechnicalAgent());
        this.registerAgent(new SupportAgent());
    }

    /**
     * Registra un nuevo agente en el sistema.
     */
    registerAgent(agent: BaseAgent) {
        this.agents.push(agent);
        logger.info(`[Orchestrator] Agente registrado: ${agent.name}`);
    }

    /**
     * Orquestación de agentes para una solicitud.
     * Implementa un flujo secuencial o paralelo según la necesidad.
     */
    async orchestrate(input: string, context: AgentContext): Promise<string> {
        logger.info(`[Orchestrator] Iniciando orquestación para: ${context.topic}`);

        // Fase 1: Procesamiento por Agentes Especializados
        // En esta versión inicialv1, pasamos el input por cada agente de forma secuencial (Refinement Chain)

        let currentContent = input;
        const responses: AgentResponse[] = [];

        for (const agent of this.agents) {
            try {
                const response = await agent.process(currentContent, context);
                responses.push(response);

                // Si el agente tiene alta confianza, actualizamos el contenido para el siguiente
                if (response.metadata.confidence > 0.5) {
                    currentContent = response.content;
                    logger.info(`[Orchestrator] Refinamiento exitoso por ${agent.name}`);
                }
            } catch (error: any) {
                logger.error(`[Orchestrator] Fallo en agente ${agent.name}: ${error.message}`);
            }
        }

        // Fase 2: Consolidación (opcionalmente sumarizada por un Agente de Consolidación en el futuro)
        return currentContent;
    }
}

export const agentOrchestrator = new AgentOrchestrator();
