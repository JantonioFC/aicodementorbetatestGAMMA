/**
 * Prompt Version Manager
 * Gestiona versionado de prompts para A/B testing y rollback.
 */
import * as fs from 'fs';
import * as path from 'path';

export interface PromptVersion {
    version: string;
    description: string;
    createdAt: string;
    SYSTEM_PROMPT: string;
    LESSON_TEMPLATE: string;
}

export class PromptVersionManager {
    private versionsDir: string;
    private versions: Map<string, PromptVersion>;
    private activeVersion: string;

    constructor() {
        this.versionsDir = path.join(__dirname, 'versions');
        this.versions = new Map();
        this.activeVersion = 'v2.0.0-storytelling'; // Default to latest

        this._loadVersions();
    }

    /**
     * Carga todas las versiones disponibles.
     */
    private _loadVersions(): void {
        try {
            const files = fs.readdirSync(this.versionsDir);

            for (const file of files) {
                if (file.endsWith('.js') && !file.startsWith('index')) {
                    const versionPath = path.join(this.versionsDir, file);
                    // Usamos require ya que son archivos JS que serán cargados en runtime
                    const version = require(versionPath);
                    this.versions.set(version.version, version);
                }
            }

            console.log(`[PromptVersionManager] Loaded ${this.versions.size} versions`);
        } catch (error: any) {
            console.error('[PromptVersionManager] Error loading versions:', error.message);
        }
    }

    /**
     * Obtiene la versión activa.
     */
    public getActive(): PromptVersion {
        return this.versions.get(this.activeVersion) || this._getLatest();
    }

    /**
     * Obtiene una versión específica.
     */
    public get(versionId: string): PromptVersion | null {
        return this.versions.get(versionId) || null;
    }

    /**
     * Establece la versión activa.
     */
    public setActive(versionId: string): boolean {
        if (this.versions.has(versionId)) {
            this.activeVersion = versionId;
            return true;
        }
        return false;
    }

    /**
     * Obtiene la versión más reciente.
     */
    private _getLatest(): PromptVersion {
        const sorted = [...this.versions.keys()].sort().reverse();
        return this.versions.get(sorted[0]) as PromptVersion;
    }

    /**
     * Lista todas las versiones disponibles.
     */
    public list(): any[] {
        return [...this.versions.entries()].map(([id, v]) => ({
            version: id,
            description: v.description,
            createdAt: v.createdAt,
            isActive: id === this.activeVersion
        }));
    }

    /**
     * Construye prompt usando la versión activa.
     */
    public buildPrompt(context: any, options: any = {}) {
        const version = this.getActive();

        let prompt = version.LESSON_TEMPLATE
            .replace(/{tematica_semanal}/g, context.tematica_semanal || '')
            .replace(/{concepto_del_dia}/g, context.concepto_del_dia || '')
            .replace(/{texto_del_pomodoro}/g, context.texto_del_pomodoro || '')
            .replace(/{student_profile}/g, options.studentProfile || '')
            .replace(/{rag_context}/g, options.ragContext || '');

        return {
            system: version.SYSTEM_PROMPT,
            prompt,
            version: version.version
        };
    }

    /**
     * Selección A/B para experimentación.
     */
    public selectABVariant(userId: string, variantVersions: string[] | null = null) {
        const variants = variantVersions || [...this.versions.keys()];

        // Hash simple del userId para selección consistente
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const selectedIndex = hash % variants.length;
        const selectedVersion = variants[selectedIndex];

        return {
            variant: selectedVersion,
            promptData: this.get(selectedVersion),
            isControl: selectedVersion === this.activeVersion
        };
    }
}

// Exportar singleton
export const promptVersionManager = new PromptVersionManager();
