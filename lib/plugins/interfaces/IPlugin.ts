/**
 * Interfaz base para Plugins
 */

export interface IPlugin {
    name: string;
    version: string;
    description: string;
    domain?: string | null;
    dependencies?: string[];

    initialize(context: any): Promise<boolean>;
    analyze(code: string, context: any): Promise<any>;
    preProcess?(code: string, context: any): { code: string; context: any };
    postProcess?(result: any, context: any): any;
    destroy(): void;
    getConfig?(): any;
    setConfig?(config: any): void;
    render?(props: any): any;
}

export function createPlugin(options: Partial<IPlugin> & Pick<IPlugin, 'name' | 'version' | 'description' | 'analyze'>): IPlugin {
    return {
        domain: null,
        dependencies: [],
        initialize: async () => true,
        destroy: () => { },
        ...options
    };
}

export function validatePlugin(plugin: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!plugin.name || typeof plugin.name !== 'string') errors.push('Missing name');
    if (!plugin.version || typeof plugin.version !== 'string') errors.push('Missing version');
    if (typeof plugin.initialize !== 'function') errors.push('Missing initialize()');
    if (typeof plugin.analyze !== 'function') errors.push('Missing analyze()');
    return { valid: errors.length === 0, errors };
}
