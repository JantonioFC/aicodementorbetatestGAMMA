/**
 * Interfaz base para Plugins
 */

export interface PluginContext {
    userId?: string;
    language?: string;
    phase?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface PluginConfig {
    enabled?: boolean;
    options?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface PluginProps {
    [key: string]: unknown;
}

export interface IPlugin {
    name: string;
    version: string;
    description: string;
    domain?: string | null;
    dependencies?: string[];

    initialize(context: PluginContext): Promise<boolean>;
    analyze(code: string, context: PluginContext): Promise<unknown>;
    preProcess?(code: string, context: PluginContext): { code: string; context: PluginContext };
    postProcess?(result: unknown, context: PluginContext): unknown;
    destroy(): void;
    getConfig?(): PluginConfig;
    setConfig?(config: PluginConfig): void;
    render?(props: PluginProps): unknown;
}

export function createPlugin(options: Partial<IPlugin> & Pick<IPlugin, 'name' | 'version' | 'description' | 'analyze' | 'initialize' | 'destroy'>): IPlugin {
    return {
        domain: null,
        dependencies: [],
        ...options
    } as IPlugin;
}

export function validatePlugin(plugin: Partial<IPlugin>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!plugin.name || typeof plugin.name !== 'string') errors.push('Missing name');
    if (!plugin.version || typeof plugin.version !== 'string') errors.push('Missing version');
    if (typeof plugin.initialize !== 'function') errors.push('Missing initialize()');
    if (typeof plugin.analyze !== 'function') errors.push('Missing analyze()');
    return { valid: errors.length === 0, errors };
}
