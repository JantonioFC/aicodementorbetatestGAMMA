import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ModuleList from './ModuleList';
import { Phase, Module, Week } from '../../types/curriculum';

interface PhaseCardProps {
    fase: Phase;
    modulos?: Module[];
    isActive: boolean;
    isLoadingModules?: boolean;
    modulesError?: { message: string; details?: string } | null;
    activeModule: number | null;
    activeWeek: Week | null;
    onPhaseToggle: (faseId: number) => void;
    onModuleToggle: (moduleId: number) => void;
    onWeekSelect: (weekData: Week) => void;
}

export default function PhaseCard({
    fase,
    modulos = [],
    isActive,
    isLoadingModules = false,
    modulesError = null,
    activeModule,
    activeWeek,
    onPhaseToggle,
    onModuleToggle,
    onWeekSelect
}: PhaseCardProps) {
    const hasModules = modulos && modulos.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
                className={`w-full text-left p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${isActive ? 'bg-blue-50 border-b border-blue-100' : 'hover:bg-gray-50'
                    }`}
                onClick={() => onPhaseToggle(fase.fase)}
                aria-expanded={isActive}
                aria-label={`Fase ${fase.fase}: ${fase.tituloFase}. ${isActive ? 'Contraer' : 'Expandir'}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isActive ? 'bg-blue-600' : 'bg-gray-400'
                            }`}>
                            {fase.fase}
                        </div>
                        <div>
                            <h3 className={`text-xl font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                                {fase.tituloFase}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Duración: {fase.duracionMeses}
                                {hasModules && ` • ${modulos.length} módulos`}
                                {isLoadingModules && ' • Cargando...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isLoadingModules && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
                        {isActive ? <ChevronDownIcon className="w-6 h-6 text-blue-600" /> : <ChevronRightIcon className="w-6 h-6 text-gray-400" />}
                    </div>
                </div>
                <p className={`mt-4 text-sm leading-relaxed ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>
                    {fase.proposito}
                </p>
            </button>

            {isActive && (
                <div className="bg-gray-50">
                    {isLoadingModules && (
                        <div className="p-8 text-center animate-pulse">
                            <p className="text-gray-600">Cargando módulos...</p>
                        </div>
                    )}

                    {modulesError && (
                        <div className="p-8">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                                <h4 className="font-bold">{modulesError.message}</h4>
                                <p className="text-sm">{modulesError.details}</p>
                            </div>
                        </div>
                    )}

                    {hasModules && !isLoadingModules && (
                        <ModuleList
                            modulos={modulos}
                            activeModule={activeModule}
                            activeWeek={activeWeek}
                            onModuleToggle={onModuleToggle}
                            onWeekSelect={onWeekSelect}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
