import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Module, Week } from '../../types/curriculum';

interface ModuleListProps {
    modulos: Module[];
    activeModule: number | null;
    activeWeek: Week | null;
    onModuleToggle: (moduleId: number) => void;
    onWeekSelect: (weekData: Week) => void;
}

export default function ModuleList({
    modulos,
    activeModule,
    activeWeek,
    onModuleToggle,
    onWeekSelect
}: ModuleListProps) {
    return (
        <div className="divide-y divide-gray-200">
            {modulos.map((modulo) => (
                <div key={modulo.modulo} className="bg-white">
                    <button
                        className={`w-full text-left px-8 py-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${activeModule === modulo.modulo
                            ? 'bg-indigo-50 border-l-4 border-indigo-500'
                            : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                        onClick={() => onModuleToggle(modulo.modulo)}
                        aria-expanded={activeModule === modulo.modulo}
                        aria-label={`Módulo ${modulo.modulo}: ${modulo.tituloModulo}. ${activeModule === modulo.modulo ? 'Contraer' : 'Expandir'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${activeModule === modulo.modulo
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {modulo.modulo}
                                </div>
                                <div>
                                    <h4 className={`text-lg font-medium ${activeModule === modulo.modulo ? 'text-indigo-900' : 'text-gray-900'
                                        }`}>
                                        {modulo.tituloModulo}
                                    </h4>
                                    <p className="text-sm text-gray-600">{modulo.weeks.length} semanas de contenido</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {activeModule === modulo.modulo ? (
                                    <ChevronDownIcon className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </button>

                    {activeModule === modulo.modulo && (
                        <div className="bg-gray-50 px-8 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {modulo.weeks.map((semana) => (
                                    <button
                                        key={semana.semana}
                                        className={`p-4 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${activeWeek?.semana === semana.semana
                                            ? 'bg-green-50 border-green-200 shadow-sm'
                                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => onWeekSelect(semana)}
                                        aria-label={`Semana ${semana.semana}: ${semana.tituloSemana}`}
                                        aria-pressed={activeWeek?.semana === semana.semana}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${activeWeek?.semana === semana.semana ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {semana.semana}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className={`text-sm font-medium leading-tight ${activeWeek?.semana === semana.semana ? 'text-green-900' : 'text-gray-900'
                                                    }`}>
                                                    {semana.tituloSemana}
                                                </h5>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{semana.tematica}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
