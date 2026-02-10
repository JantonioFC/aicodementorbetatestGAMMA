'use client';

import React from 'react';
import {
    LightBulbIcon,
    MapIcon,
    ClockIcon,
    CheckCircleIcon,
    StarIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

interface PlanPaso {
    foco?: string;
    descripcion?: string;
    dias?: number | string;
    dia?: number | string;
    tareas?: string[];
}

interface GuiaEstudioData {
    titulo?: string;
    enfoque?: string;
    planSugerido?: (string | PlanPaso)[];
}

interface GuiaEstudioProps {
    weekData: {
        semana: number;
        tituloSemana: string;
        tematica?: string;
        entregables?: string;
        recursos?: { nombre: string; url: string }[];
        officialSources?: { nombre?: string; title?: string; url: string }[];
        guiaEstudio: GuiaEstudioData;
    };
}

export default function GuiaEstudio({ weekData }: GuiaEstudioProps) {
    if (!weekData || !weekData.guiaEstudio) return null;
    const { guiaEstudio } = weekData;

    return (
        <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6 rounded-xl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">{weekData.semana}</div>
                            <div className="flex-1">
                                <span className="text-[10px] uppercase font-bold text-purple-200 tracking-widest">Guía de Estudio Estratégico</span>
                                <h3 className="text-2xl font-black">{weekData.tituloSemana}</h3>
                            </div>
                            <StarIcon className="w-8 h-8 text-yellow-300 fill-current" />
                        </div>
                    </div>
                    <div className="p-6 bg-purple-50 flex items-start gap-3">
                        <LightBulbIcon className="w-6 h-6 text-purple-600" />
                        <p className="text-purple-900 font-medium">Esta semana se enfoca en un proyecto práctico para consolidar tus habilidades profesionales.</p>
                    </div>
                </div>

                {guiaEstudio.planSugerido && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex gap-2 items-center">
                            <ClockIcon className="w-6 h-6 text-green-600" /> Plan de Trabajo
                        </h4>
                        <div className="space-y-4">
                            {guiaEstudio.planSugerido.map((paso, idx) => {
                                const isString = typeof paso === 'string';
                                const foco = isString ? `Paso ${idx + 1}` : (paso.foco || paso.descripcion || `Paso ${idx + 1}`);
                                const tareas = isString ? [paso] : (paso.tareas || []);

                                return (
                                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                            <h5 className="font-bold text-green-900">{foco}</h5>
                                        </div>
                                        <ul className="space-y-1 pl-10">
                                            {tareas.map((t, ti) => (
                                                <li key={ti} className="text-sm text-gray-700 flex gap-2">
                                                    <span className="text-green-500">•</span> {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
