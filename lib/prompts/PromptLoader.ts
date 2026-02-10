// Módulos nativos (solo carga en servidor)
let fs: any = null;
let path: any = null;

if (typeof window === 'undefined') {
    try {
        fs = require('fs');
        path = require('path');
    } catch (e) {
        // Fallback for edge
    }
}

/**
 * Utility to load and manage externalized prompts.
 * Supports caching and variable interpolation.
 */
export class PromptLoader {
    private baseDir: string;
    private cache: Map<string, any>;

    constructor(baseDir: string = '') {
        this.baseDir = baseDir;
        this.cache = new Map();

        // Initialize baseDir with process.cwd if not provided and in Node (safely accessed)
        const globalProc = globalThis['process' as keyof typeof globalThis] as any;
        if (!this.baseDir && globalProc && typeof globalProc.cwd === 'function') {
            // Default to lib/prompts/external relative to cwd
            // We need path to join
            if (path) {
                this.baseDir = path.join(globalProc.cwd(), 'lib', 'prompts', 'external');
            }
        }
    }

    /**
     * Cargar prompt desde archivo JSON/YAML con soporte opcional de subdirectorio (scope)
     */
    load(fileName: string, scope: string = '', useCache: boolean = true): any {
        if (typeof window !== 'undefined') {
            console.warn('[PromptLoader] File loading not supported in browser');
            return {};
        }

        if (!fs || !path) {
            console.warn('[PromptLoader] fs/path not available');
            return {};
        }

        const cacheKey = scope ? `${scope}/${fileName}` : fileName;
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const targetDir = scope ? path.join(this.baseDir, scope) : this.baseDir;
            const filePath = path.join(targetDir, fileName);

            if (!fs.existsSync(filePath)) {
                // Fallback a baseDir si no se encuentra en el scope
                if (scope) {
                    const fallbackPath = path.join(this.baseDir, fileName);
                    if (fs.existsSync(fallbackPath)) {
                        const content = fs.readFileSync(fallbackPath, 'utf-8');
                        const data = JSON.parse(content);
                        if (useCache) this.cache.set(cacheKey, data);
                        return data;
                    }
                }
                throw new Error(`File not found: ${filePath}`);
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            if (useCache) {
                this.cache.set(cacheKey, data);
            }

            return data;
        } catch (error: any) {
            throw new Error(`Failed to load prompt file '${fileName}' (scope: ${scope}): ${error.message}`);
        }
    }

    /**
     * Replaces placeholders in a template string with values.
     * Supports both {key} and {{key}} formats.
     * @param {string} template - The string with {placeholders}
     * @param {Record<string, string>} variables - Key-value pairs matching placeholders
     * @returns {string} The interpolated string
     */
    interpolate(template: string, variables: Record<string, string>): string {
        if (!template) return '';
        let result = template;

        // Handle {{key}} format
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        }

        // Handle {key} format
        result = result.replace(/\{(\w+)\}/g, (match, key) => {
            return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
        });

        return result;
    }

    /**
     * Clears the internal cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Singleton instance by default, but class is exported for testing/custom usage
export const promptLoader = new PromptLoader();
