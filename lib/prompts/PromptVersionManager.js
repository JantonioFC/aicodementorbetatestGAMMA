/**
 * Prompt Version Manager
 * Gestiona versionado de prompts para A/B testing y rollback.
 */
const fs = require('fs');
const path = require('path');

class PromptVersionManager {
    constructor() {
        this.versionsDir = path.join(__dirname, 'versions');
        this.versions = new Map();
        this.activeVersion = 'v2.0.0-storytelling'; // Default to latest

        this._loadVersions();
    }

    /**
     * Carga todas las versiones disponibles.
     * @private
     */
    _loadVersions() {
        try {
            const files = fs.readdirSync(this.versionsDir);

            for (const file of files) {
                if (file.endsWith('.js') && !file.startsWith('index')) {
                    const versionPath = path.join(this.versionsDir, file);
                    const version = require(versionPath);
                    this.versions.set(version.version, version);
                }
            }

            console.log(`[PromptVersionManager] Loaded ${this.versions.size} versions`);
        } catch (error) {
            console.error('[PromptVersionManager] Error loading versions:', error.message);
        }
    }

    /**
     * Obtiene la versión activa.
     * @returns {Object}
     */
    getActive() {
        return this.versions.get(this.activeVersion) || this._getLatest();
    }

    /**
     * Obtiene una versión específica.
     * @param {string} versionId 
     * @returns {Object|null}
     */
    get(versionId) {
        return this.versions.get(versionId) || null;
    }

    /**
     * Establece la versión activa.
     * @param {string} versionId 
     * @returns {boolean}
     */
    setActive(versionId) {
        if (this.versions.has(versionId)) {
            this.activeVersion = versionId;
            console.log(`[PromptVersionManager] Active version set to: ${versionId}`);
            return true;
        }
        return false;
    }

    /**
     * Obtiene la versión más reciente.
     * @private
     */
    _getLatest() {
        const sorted = [...this.versions.keys()].sort().reverse();
        return this.versions.get(sorted[0]);
    }

    /**
     * Lista todas las versiones disponibles.
     * @returns {Array}
     */
    list() {
        return [...this.versions.entries()].map(([id, v]) => ({
            version: id,
            description: v.description,
            createdAt: v.createdAt,
            isActive: id === this.activeVersion
        }));
    }

    /**
     * Construye prompt usando la versión activa.
     * @param {Object} context - { tematica_semanal, concepto_del_dia, texto_del_pomodoro }
     * @param {Object} options - { studentProfile, ragContext }
     * @returns {Object} { system, prompt }
     */
    buildPrompt(context, options = {}) {
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
     * @param {string} userId - Para consistencia de usuario
     * @param {Array<string>} variantVersions - Versiones a probar
     * @returns {Object}
     */
    selectABVariant(userId, variantVersions = null) {
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

    /**
     * Compara prompts entre versiones.
     * @param {string} v1 
     * @param {string} v2 
     * @returns {Object}
     */
    compare(v1, v2) {
        const version1 = this.get(v1);
        const version2 = this.get(v2);

        if (!version1 || !version2) {
            return { error: 'Version not found' };
        }

        return {
            v1: {
                version: v1,
                systemPromptLength: version1.SYSTEM_PROMPT.length,
                templateLength: version1.LESSON_TEMPLATE.length
            },
            v2: {
                version: v2,
                systemPromptLength: version2.SYSTEM_PROMPT.length,
                templateLength: version2.LESSON_TEMPLATE.length
            },
            diff: {
                systemPrompt: version1.SYSTEM_PROMPT.length - version2.SYSTEM_PROMPT.length,
                template: version1.LESSON_TEMPLATE.length - version2.LESSON_TEMPLATE.length
            }
        };
    }
}

// Exportar singleton
const promptVersionManager = new PromptVersionManager();
module.exports = { promptVersionManager, PromptVersionManager };
