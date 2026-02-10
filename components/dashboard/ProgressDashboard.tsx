'use client';

import { useState, useEffect } from 'react';
import PhaseProgressBar from './PhaseProgressBar';
import { ProgressSummary } from '../../types/dashboard';

export default function ProgressDashboard() {
    const [data, setData] = useState<ProgressSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSummary() {
            try {
                setLoading(true);
                const res = await fetch('/api/progress/summary');
                if (!res.ok) throw new Error('Error al cargar progreso');
                setData(await res.json());
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSummary();
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Analizando tu progreso...</div>;
    if (error) return <div className="p-10 text-red-600 bg-red-50 border rounded-xl">{error}</div>;
    if (!data) return null;

    return (
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Tu Ruta 360</h2>
                    <p className="text-gray-500 font-medium">Visualización del avance curricular</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Progreso Global</p>
                    <p className="text-4xl font-black text-indigo-600">{data.summary.porcentajeTotalCompletado}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <StatCard label="Semanas Completadas" value={data.summary.totalSemanasCompletadas} total={data.summary.totalSemanasIniciadas} color="emerald" />
                <StatCard label="Fases Iniciadas" value={data.progresoPorFase.length} total={8} color="indigo" />
            </div>

            <div className="space-y-6">
                {data.progresoPorFase.map(f => (
                    <PhaseProgressBar
                        key={f.faseId}
                        faseId={f.faseId}
                        tituloFase={f.tituloFase}
                        semanasEnFase={f.semanasEnFase}
                        semanasCompletadas={f.semanasCompletadas}
                        porcentajeCompletado={f.porcentajeCompletado}
                    />
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, total, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    };
    return (
        <div className={`p-6 rounded-2xl border ${colors[color]}`}>
            <p className="text-xs font-black uppercase mb-1 opacity-70">{label}</p>
            <p className="text-3xl font-black">{value} <span className="text-sm opacity-50">/ {total}</span></p>
        </div>
    );
}
