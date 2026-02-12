'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';
import { Phase, CompetencyLevel, ModuleStats } from '../../types/dashboard';

export default function EnhancedUnifiedDashboard() {
    const {
        dashboardData,
        entryCounts,
        recentEntries,
        loadDashboardData
    } = useProjectTracking();

    const [moduleStats, setModuleStats] = useState<ModuleStats | null>(null);
    const [currentPhase, setCurrentPhase] = useState(0);

    const curriculumPhases: Phase[] = [
        { id: 0, name: 'Cimentación', duration: '3-4 meses', focus: 'IA Crítica', color: 'from-gray-500 to-slate-600', competencies: ['Ética IA'], months: '0' },
        { id: 1, name: 'Fundamentos', duration: '6 meses', focus: 'Python', color: 'from-blue-500 to-cyan-500', competencies: ['Python'], months: '1-6' },
        // Simplified for brevity in migration
    ];

    const competencyLevels: CompetencyLevel[] = [
        { level: 1, name: 'Principiante', description: 'Básico', color: 'bg-red-100', threshold: 0 },
        { level: 5, name: 'Experto', description: 'Liderazgo', color: 'bg-blue-100', threshold: 90 }
    ];

    useEffect(() => {
        loadDashboardData();
        fetch('/api/get-modules').then(r => r.json()).then(d => setModuleStats(d.stats));
    }, [loadDashboardData]);

    const totalEntries = Object.values(entryCounts).reduce((a, b) => a + b, 0);
    const progress = moduleStats?.overallProgress || 0;

    return (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <header className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
                <h2 className="text-3xl font-black mb-2">Ecosistema 360</h2>
                <p className="opacity-80 text-sm italic font-medium">Simbiosis Crítica Humano-IA & Portfolio de Evidencias</p>
            </header>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Evidencias" value={totalEntries} color="text-indigo-600" />
                    <MetricCard label="Módulos" value={moduleStats?.totalModules || 0} color="text-emerald-600" />
                    <MetricCard label="Progreso" value={`${progress}%`} color="text-amber-600" />
                    <MetricCard label="Fase Actual" value={`F${currentPhase}`} color="text-rose-600" />
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border">
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Actividad Reciente</h3>
                    <div className="space-y-3">
                        {recentEntries?.slice(0, 3).map(e => (
                            <div key={e.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{e.entry_type.replace('_', ' ')}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(e.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-50 text-center hover:border-indigo-100 transition-all">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
    );
}
