'use client';

import { useState } from 'react';
import PhaseCard from './PhaseCard';
import WeekDetailsLoader from './WeekDetailsLoader';
import { CurriculumSummary, Phase, Module, Week } from '../../types/curriculum';

interface CurriculumBrowserProps {
    curriculumData: CurriculumSummary;
}

export default function CurriculumBrowser({ curriculumData }: CurriculumBrowserProps) {
    const [activePhase, setActivePhase] = useState<number | null>(null);
    const [activeModule, setActiveModule] = useState<number | null>(null);
    const [activeWeek, setActiveWeek] = useState<Week | null>(null);

    const [phaseModules, setPhaseModules] = useState<Record<number, Module[]>>({});
    const [loadingModules, setLoadingModules] = useState<Record<number, boolean>>({});
    const [modulesError, setModulesError] = useState<Record<number, any>>({});

    const [weekDetailsData, setWeekDetailsData] = useState<any>(null);
    const [loadingWeekDetails, setLoadingWeekDetails] = useState(false);
    const [weekDetailsError, setWeekDetailsError] = useState<any>(null);

    const loadPhaseModules = async (phaseId: number) => {
        if (phaseModules[phaseId]) return;

        try {
            setLoadingModules(prev => ({ ...prev, [phaseId]: true }));
            const response = await fetch(`/api/v1/phases/${phaseId}/modules`);
            if (!response.ok) throw new Error('Error al cargar módulos');
            const data = await response.json();
            setPhaseModules(prev => ({ ...prev, [phaseId]: data.modulos }));
        } catch (error: any) {
            setModulesError(prev => ({ ...prev, [phaseId]: { message: error.message } }));
        } finally {
            setLoadingModules(prev => ({ ...prev, [phaseId]: false }));
        }
    };

    const handlePhaseToggle = (phaseId: number) => {
        if (activePhase === phaseId) {
            setActivePhase(null);
            setActiveModule(null);
            setActiveWeek(null);
            setWeekDetailsData(null);
        } else {
            setActivePhase(phaseId);
            setActiveModule(null);
            setActiveWeek(null);
            setWeekDetailsData(null);
            loadPhaseModules(phaseId);
        }
    };

    const handleWeekSelect = async (week: Week) => {
        if (activeWeek?.semana === week.semana) {
            setActiveWeek(null);
            setWeekDetailsData(null);
            return;
        }

        setActiveWeek(week);
        setLoadingWeekDetails(true);
        setWeekDetailsError(null);

        try {
            const response = await fetch(`/api/v1/weeks/${week.semana}/details`);
            if (!response.ok) throw new Error('Error al cargar detalles');
            const data = await response.json();
            setWeekDetailsData(data);
        } catch (error: any) {
            setWeekDetailsError({ message: error.message });
        } finally {
            setLoadingWeekDetails(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Estructura Curricular</h1>
                <p className="text-gray-500">Programa formativo Ecosistema 360 • Fases, Módulos y Semanas</p>
                <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    ⚡ Carga Optimizada Activa
                </div>
            </div>

            <div className="space-y-4">
                {curriculumData.curriculum.map((fase) => (
                    <PhaseCard
                        key={fase.fase}
                        fase={fase}
                        modulos={phaseModules[fase.fase]}
                        isActive={activePhase === fase.fase}
                        isLoadingModules={loadingModules[fase.fase]}
                        modulesError={modulesError[fase.fase]}
                        activeModule={activeModule}
                        activeWeek={activeWeek}
                        onPhaseToggle={handlePhaseToggle}
                        onModuleToggle={setActiveModule}
                        onWeekSelect={handleWeekSelect}
                    />
                ))}
            </div>

            {activeWeek && (
                <div className="mt-12 animate-in slide-in-from-bottom-4">
                    <WeekDetailsLoader
                        activeWeek={activeWeek}
                        weekDetailsData={weekDetailsData}
                        loadingWeekDetails={loadingWeekDetails}
                        weekDetailsError={weekDetailsError}
                        onRetry={() => handleWeekSelect(activeWeek)}
                    />
                </div>
            )}
        </div>
    );
}
