export interface Template {
    name: string;
    subtitle: string;
    description: string;
    icon: string;
    template: string;
    metadata_fields?: Record<string, string>;
}

export type TemplateType =
    | 'daily_reflection'
    | 'weekly_review'
    | 'dde_entry'
    | 'weekly_action_plan'
    | 'unified_tracking_log'
    | 'quality_checklist_precommit'
    | 'quality_checklist_project'
    | 'quality_checklist_weekly'
    | 'project_documentation'
    | 'technical_documentation';

export interface GenerationResult {
    content: string;
    metadata: {
        generatedAt: string;
        templateType: string;
        templateName: string;
        placeholdersUsed: number;
    };
    filename: string;
}
