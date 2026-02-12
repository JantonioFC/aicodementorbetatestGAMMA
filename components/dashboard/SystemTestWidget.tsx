'use client';

import { useState } from 'react';
import { TestResults, ExecutionDetails } from '../../types/dashboard';

export default function SystemTestWidget() {
    const [testState, setTestState] = useState<'idle' | 'running' | 'success' | 'failed' | 'error'>('idle');
    const [results, setResults] = useState<TestResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runTests = async () => {
        try {
            setTestState('running');
            const res = await fetch('/api/system-check/run-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'playwright-full' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error de ejecución');
            setResults(data.testResults);
            setTestState(data.testResults.success ? 'success' : 'failed');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setTestState('error');
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">Salud del Sistema</h3>
                    <p className="text-gray-500 text-sm">Validación automática mediante Playwright</p>
                </div>
                <StatusBadge state={testState} />
            </div>

            {results && (
                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <Stat label="Total" value={results.stats.total} />
                        <Stat label="Pasaron" value={results.stats.passed} color="text-emerald-600" />
                        <Stat label="Fallaron" value={results.stats.failed} color="text-red-600" />
                    </div>
                </div>
            )}

            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-mono">{error}</div>}

            <button
                onClick={runTests}
                disabled={testState === 'running'}
                className="w-full bg-black text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
                {testState === 'running' ? 'EJECUTANDO TESTS...' : 'INICIAR PROTOCOLO DE PRUEBA'}
            </button>
        </div>
    );
}


interface StatProps {
    label: string;
    value: string | number;
    color?: string;
}

function StatusBadge({ state }: { state: string }) {
    const configs: Record<string, { label: string; color: string }> = {
        idle: { label: 'LISTO', color: 'bg-gray-100 text-gray-600' },
        running: { label: 'EN CURSO', color: 'bg-indigo-100 text-indigo-600 animate-pulse' },
        success: { label: 'OK', color: 'bg-emerald-100 text-emerald-600' },
        failed: { label: 'FALLOS', color: 'bg-red-100 text-red-600' },
        error: { label: 'ERROR', color: 'bg-red-600 text-white' }
    };
    const config = configs[state] || configs.idle;
    return <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${config.color}`}>{config.label}</span>;
}

function Stat({ label, value, color = 'text-gray-900' }: StatProps) {
    return (
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
    );
}
