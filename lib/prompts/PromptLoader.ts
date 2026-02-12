import { logger } from '../observability/Logger';

// Utility to safely access global modules
interface SystemModules {
    fs: typeof import('fs') | null;
    path: typeof import('path') | null;
}

const sys: SystemModules = {
    fs: null,
    path: null
};

if (typeof window === 'undefined') {
    try {
        sys.fs = require('fs');
        sys.path = require('path');
    } catch (e: unknown) {
        // Fallback for edge or other non-node environments
    }
}

/**
 * Utility to load and manage externalized prompts.
 * Supports caching and variable interpolation.
 */
export class PromptLoader {
    private baseDir: string;
    private cache: Map<string, Record<string, unknown>>;

    constructor(baseDir: string = '') {
        this.baseDir = baseDir;
        this.cache = new Map();

        // Initialize baseDir with process.cwd if not provided and in Node (safely accessed)
        if (!this.baseDir && typeof process !== 'undefined' && typeof process.cwd === 'function') {
            // Default to lib/prompts/external relative to cwd
            if (sys.path) {
                this.baseDir = sys.path.join(process.cwd(), 'lib', 'prompts', 'external');
            }
        }
    }

    /**
     * Cargar prompt desde archivo JSON/YAML con soporte opcional de subdirectorio (scope)
     */
    load(fileName: string, scope: string = '', useCache: boolean = true): Record<string, unknown> {
        if (typeof window !== 'undefined') {
            logger.warn('[PromptLoader] File loading not supported in browser');
            return {};
        }

        if (!sys.fs || !sys.path) {
            logger.warn('[PromptLoader] fs/path not available');
            return {};
        }

        const cacheKey = scope ? `${scope}/${fileName}` : fileName;
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) || {};
        }

        try {
            const targetDir = scope ? sys.path.join(this.baseDir, scope) : this.baseDir;
            const filePath = sys.path.join(targetDir, fileName);

            if (!sys.fs.existsSync(filePath)) {
                // Fallback a baseDir si no se encuentra en el scope
                if (scope) {
                    const fallbackPath = sys.path.join(this.baseDir, fileName);
                    if (sys.fs.existsSync(fallbackPath)) {
                        const content = sys.fs.readFileSync(fallbackPath, 'utf-8');
                        const data = JSON.parse(content) as Record<string, unknown>;
                        if (useCache) this.cache.set(cacheKey, data);
                        return data;
                    }
                }
                throw new Error(`File not found: ${filePath}`);
            }

            const fileContent = sys.fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent) as Record<string, unknown>;

            if (useCache) {
                this.cache.set(cacheKey, data);
            }

            return data;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load prompt file '${fileName}' (scope: ${scope}): ${message}`);
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
