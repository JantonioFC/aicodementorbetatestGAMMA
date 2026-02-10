import { Template, TemplateType } from '../types/templates';

export const TEMPLATES: Record<string, Template> = {
    daily_reflection: {
        name: 'Reflexión Diaria',
        subtitle: 'Metacognición • Seguimiento Personal',
        description: 'Reflexión diaria sobre progreso y aprendizaje siguiendo principios de andamiaje decreciente',
        icon: '📝',
        template: `# Mi Reflexión Diaria - {date}\n\n## ¿Qué logré hoy?\n- [Logro específico 1]\n\n## ¿Qué aprendí?\n- **Técnico:** [Concepto]\n\n## ¿Qué desafíos enfrenté?\n- [Desafío] → **Solución:** [Cómo lo resolví]`,
    },
    weekly_review: {
        name: 'Revisión Semanal',
        subtitle: 'Evaluación • Progreso Curricular',
        description: 'Evaluación semanal de progreso y metas',
        icon: '📊',
        template: `# Revisión Semanal - Semana {week_number}\n**Fechas:** {start_date} a {end_date}\n\n## Objetivos\n- [ ] [Objetivo 1]`,
    },
    dde_entry: {
        name: 'Diario de Decisiones de Ingeniería (DDE)',
        subtitle: 'Simbiosis Crítica Humano-IA',
        description: 'Documenta decisiones técnicas importantes',
        icon: '📋',
        template: `# Decisión #{decision_number}: {decision_title}\n**Fecha:** {date}\n\n## 1. Contexto del Problema\n[Descripción]`,
    },
    // Add more as needed or keep it clean for brevity in the migration
};

export const ENTRY_TYPES: TemplateType[] = [
    'daily_reflection',
    'weekly_review',
    'dde_entry',
    'weekly_action_plan',
    'unified_tracking_log',
    'quality_checklist_precommit',
    'quality_checklist_project',
    'quality_checklist_weekly',
    'project_documentation',
    'technical_documentation'
];

export function getTemplate(entryType: string): Template | null {
    return TEMPLATES[entryType] || null;
}

export function getAllTemplates() {
    return TEMPLATES;
}

export function getTemplatesByCategory(): Record<string, string[]> {
    return {
        'Reflexión y Seguimiento': [
            'daily_reflection',
            'weekly_review',
            'weekly_action_plan'
        ],
        'Documentación Educativa': [
            'dde_entry',
            'unified_tracking_log',
            'project_documentation',
            'technical_documentation'
        ],
        'Control de Calidad': [
            'quality_checklist_precommit',
            'quality_checklist_project',
            'quality_checklist_weekly'
        ]
    };
}
