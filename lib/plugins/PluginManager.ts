import { IPlugin, validatePlugin } from './interfaces/IPlugin';

export class PluginManager {
    private plugins: Map<string, IPlugin> = new Map();
    private domainPlugins: Map<string, string[]> = new Map();
    private initialized: boolean = false;
    private context: any = {};

    register(plugin: IPlugin): { success: boolean; error?: string } {
        const validation = validatePlugin(plugin);
        if (!validation.valid) {
            return { success: false, error: `Invalid: ${validation.errors.join(', ')}` };
        }

        if (this.plugins.has(plugin.name)) this.unregister(plugin.name);

        for (const dep of plugin.dependencies || []) {
            if (!this.plugins.has(dep)) return { success: false, error: `Missing dep: ${dep}` };
        }

        this.plugins.set(plugin.name, plugin);
        if (plugin.domain) {
            if (!this.domainPlugins.has(plugin.domain)) this.domainPlugins.set(plugin.domain, []);
            this.domainPlugins.get(plugin.domain)!.push(plugin.name);
        }

        return { success: true };
    }

    unregister(name: string): boolean {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        for (const [otherName, otherPlugin] of this.plugins) {
            if (otherPlugin.dependencies?.includes(name)) return false;
        }

        try { plugin.destroy(); } catch (e) { }

        if (plugin.domain) {
            const list = this.domainPlugins.get(plugin.domain) || [];
            this.domainPlugins.set(plugin.domain, list.filter(n => n !== name));
        }

        this.plugins.delete(name);
        return true;
    }

    async initializeAll(context: any = {}): Promise<{ initialized: string[]; failed: string[] }> {
        this.context = context;
        const initialized: string[] = [];
        const failed: string[] = [];
        const sorted = this._sortByDependencies();

        for (const plugin of sorted) {
            try {
                if (await plugin.initialize(this.context)) initialized.push(plugin.name);
                else failed.push(plugin.name);
            } catch (e) { failed.push(plugin.name); }
        }

        this.initialized = true;
        return { initialized, failed };
    }

    private _sortByDependencies(): IPlugin[] {
        const sorted: IPlugin[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (plugin: IPlugin) => {
            if (visited.has(plugin.name)) return;
            if (visiting.has(plugin.name)) throw new Error('Circular dependency');
            visiting.add(plugin.name);

            for (const depName of plugin.dependencies || []) {
                const dep = this.plugins.get(depName);
                if (dep) visit(dep);
            }

            visiting.delete(plugin.name);
            visited.add(plugin.name);
            sorted.push(plugin);
        };

        for (const plugin of this.plugins.values()) visit(plugin);
        return sorted;
    }

    async analyze(code: string, context: any): Promise<any> {
        let pc = code;
        let pctx = { ...context };

        for (const p of this.plugins.values()) {
            if (p.preProcess) {
                const r = p.preProcess(pc, pctx);
                pc = r.code; pctx = r.context;
            }
        }

        const results = new Map();
        const relevant = context.domain ? (this.domainPlugins.get(context.domain) || []).map(n => this.plugins.get(n)!) : Array.from(this.plugins.values());

        for (const p of relevant) {
            try { results.set(p.name, await p.analyze(pc, pctx)); } catch (e) { }
        }

        let combined = { code: pc, context: pctx, pluginResults: Object.fromEntries(results) };
        for (const p of this.plugins.values()) {
            if (p.postProcess) combined = p.postProcess(combined, pctx);
        }

        return combined;
    }
}

export const pluginManager = new PluginManager();
