'use client';

import {
    AcademicCapIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    LinkIcon,
    CalendarDaysIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import WeeklySchedule from './WeeklySchedule';
import { DayData } from './WeeklySchedule';

interface Resource {
    nombre: string;
    url: string;
}

interface Source {
    nombre?: string;
    title?: string;
    url: string;
}

export interface WeekDetailsProps {
    weekData: {
        semana: number;
        tituloSemana: string;
        objetivos?: string[];
        tematica?: string;
        actividades?: string[];
        entregables?: string;
        recursos?: Resource[];
        officialSources?: Source[];
        ejercicios?: Resource[];
        esquemaDiario: DayData[];
    };
}

export default function WeekDetails({ weekData }: WeekDetailsProps) {
    const [showSchedule, setShowSchedule] = useState(true);

    if (!weekData) return null;

    return (
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">{weekData.semana}</div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">{weekData.tituloSemana}</h3>
                        <p className="text-gray-500 text-sm">Semana {weekData.semana} • Detalles del módulo</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card icon={<AcademicCapIcon className="w-5 h-5 text-blue-600" />} title="Objetivos">
                        <ul className="space-y-1">
                            {(weekData.objetivos || []).map((obj, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5" /> {obj}</li>
                            ))}
                        </ul>
                    </Card>

                    <Card icon={<BookOpenIcon className="w-5 h-5 text-purple-600" />} title="Temática">
                        <p className="text-sm text-gray-700 leading-relaxed">{weekData.tematica || 'No definida'}</p>
                    </Card>

                    <Card icon={<ClipboardDocumentListIcon className="w-5 h-5 text-orange-600" />} title="Actividades">
                        <ul className="space-y-1">
                            {(weekData.actividades || []).map((act, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2"><div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5" /> {act}</li>
                            ))}
                        </ul>
                    </Card>

                    <Card icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />} title="Entregable">
                        <div className="bg-green-50 border border-green-100 p-3 rounded text-sm text-green-900 font-medium">
                            {weekData.entregables || 'No definido'}
                        </div>
                    </Card>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setShowSchedule(!showSchedule)}
                        className="w-full flex justify-between items-center p-4 hover:bg-gray-50 bg-indigo-50/30"
                    >
                        <div className="flex gap-2 items-center font-bold text-gray-900">
                            <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                            Esquema de Trabajo (EST)
                        </div>
                        {showSchedule ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                    </button>
                    {showSchedule && (
                        <div className="border-t">
                            <WeeklySchedule weekData={weekData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Card({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="font-bold text-gray-900">{title}</h4>
            </div>
            {children}
        </div>
    );
}
