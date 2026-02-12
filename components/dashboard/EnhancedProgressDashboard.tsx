'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PhaseProgressBar from './PhaseProgressBar';

const TrendChart = dynamic(() => import('../common/charts/TrendChart'), { ssr: false });
const QualityGauge = dynamic(() => import('../common/charts/QualityGauge'), { ssr: false });
const ComparisonBar = dynamic(() => import('../common/charts/ComparisonBar'), { ssr: false });
const TimelineChart = dynamic(() => import('../common/charts/TimelineChart'), { ssr: false });

interface FaseProgreso {
    faseId: number;
    tituloFase: string;
    semanasEnFase: number;
    semanasCompletadas: number;
    porcentajeCompletado: number;
}

interface ProgressSummary {
    totalSemanasCompletadas: number;
    totalSemanasIniciadas: number;
    porcentajeTotalCompletado: number;
}

interface ProgressData {
    summary: ProgressSummary;
    progresoPorFase: FaseProgreso[];
}

export default function EnhancedProgressDashboard() {
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgressSummary = async () => {
            try {
                const response = await fetch('/api/progress/summary');
                if (!response.ok) throw new Error(`Error ${response.status}`);
                const result = await response.json();
                setData(result);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchProgressSummary();
    }, []);

    if (loading) return (
        <div
            className="p-6 animate-pulse bg-gray-100 rounded-lg h-64"
            aria-busy="true"
            aria-live="polite"
            aria-label="Cargando resumen de progreso"
        ></div>
    );
    if (error) return <div className="p-6 text-red-600" role="alert">Error: {error}</div>;
    if (!data) return null;

    const trendData = data.progresoPorFase.map(fase => ({
        label: `Fase ${fase.faseId}`,
        value: fase.porcentajeCompletado
    }));

    const timelineData = data.progresoPorFase
        .filter(fase => fase.semanasCompletadas > 0)
        .map(fase => ({
            id: fase.faseId,
            title: fase.tituloFase.substring(0, 20),
            date: `Fase ${fase.faseId}`,
            status: 'completed' as const,
            description: `${fase.semanasCompletadas} semanas completadas`
        }));

    return (
        <div className="space-y-6" role="region" aria-label="Tablero de Progreso Mejorado">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm" aria-label={`Semanas completadas: ${data.summary.totalSemanasCompletadas}`}>
                    <p className="text-sm text-gray-500 uppercase font-bold">Semanas</p>
                    <p className="text-4xl font-bold">{data.summary.totalSemanasCompletadas}</p>
                    <p className="text-xs text-gray-400">de {data.summary.totalSemanasIniciadas} iniciadas</p>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm" aria-label={`Progreso total: ${data.summary.porcentajeTotalCompletado} por ciento`}>
                    <p className="text-sm text-gray-500 uppercase font-bold">Progreso Total</p>
                    <p className="text-4xl font-bold">{data.summary.porcentajeTotalCompletado}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="region" aria-label="Gráficos de rendimiento">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <TrendChart data={trendData} title="Tendencia" color="blue" />
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <QualityGauge score={data.summary.porcentajeTotalCompletado} label="Score" />
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <ComparisonBar value={data.summary.porcentajeTotalCompletado} avgValue={100} label="vs Objetivo" />
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <TimelineChart events={timelineData} title="Actividad" />
                </div>
            </div>

            <div className="space-y-4" role="list" aria-label="Progreso detallado por fase">
                {data.progresoPorFase.map(fase => (
                    <PhaseProgressBar key={fase.faseId} {...fase} />
                ))}
            </div>
        </div>
    );
}
