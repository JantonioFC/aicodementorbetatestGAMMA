'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import InteractiveQuiz from '../quiz/InteractiveQuiz';

interface PomodoroBlock {
    title: string;
    duration: string;
    bgColor: string;
    textColor: string;
    icon: any;
    pomodoros: string[];
}

interface DayData {
    dia: number;
    concepto: string;
    pomodoros: string[];
}

interface WeekData {
    semana: number;
    tituloSemana: string;
    entregables?: string;
    esquemaDiario: DayData[];
}

interface WeeklyScheduleProps {
    weekData: WeekData;
}

export default function WeeklySchedule({ weekData }: WeeklyScheduleProps) {
    const [checkedState, setCheckedState] = useState({
        ejercicios: false,
        miniProyecto: false,
        dma: false,
        commits: false
    });

    const [isLoadingProgress, setIsLoadingProgress] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const response = await fetch(`/api/est/${weekData.semana}`);
                if (response.ok) {
                    const result = await response.json();
                    setCheckedState(result.checkedState);
                    if (result.lastUpdated) setLastSaved(new Date(result.lastUpdated));
                }
            } finally {
                setIsLoadingProgress(false);
            }
        };
        loadProgress();
    }, [weekData]);

    const handleToggle = async (item: keyof typeof checkedState) => {
        const newState = { ...checkedState, [item]: !checkedState[item] };
        setCheckedState(newState);
        await fetch(`/api/est/${weekData.semana}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkedState: newState })
        });
        setLastSaved(new Date());
    };

    const scheduleData = weekData.esquemaDiario.map(dia => ({
        day: `Día ${dia.dia}`,
        theme: dia.concepto,
        blocks: [
            {
                title: "Adquisición",
                duration: "2h",
                bgColor: "bg-slate-800",
                textColor: "text-white",
                icon: AcademicCapIcon,
                pomodoros: dia.pomodoros.slice(0, 2)
            },
            {
                title: "Aplicación",
                duration: "2h",
                bgColor: "bg-gray-700",
                textColor: "text-white",
                icon: CodeBracketIcon,
                pomodoros: dia.pomodoros.slice(2, 4)
            }
        ]
    }));

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-3xl font-black text-gray-900 mb-2">Esquema Semanal (EST)</h3>
                <p className="text-indigo-600 font-bold">Semana {weekData.semana}: {weekData.tituloSemana}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {scheduleData.map((day, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-indigo-600 p-3 text-white text-center">
                            <h4 className="font-bold text-sm">{day.day}</h4>
                            <p className="text-[10px] opacity-80 line-clamp-1">{day.theme}</p>
                        </div>
                        <div className="p-3 space-y-3">
                            {day.blocks.map((block, bIdx) => (
                                <div key={bIdx} className={`${block.bgColor} ${block.textColor} p-3 rounded-lg`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <block.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase">{block.title}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {block.pomodoros.map((p, pIdx) => (
                                            <div key={pIdx} className="text-[11px] leading-tight flex gap-1">
                                                <span>🎯</span> {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-bold mb-4 flex justify-between">
                    <span>📋 Checklist de Entregables</span>
                    {lastSaved && <span className="text-[10px] text-green-600 font-normal italic">Guardado {lastSaved.toLocaleTimeString()}</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(checkedState) as Array<keyof typeof checkedState>).map(key => (
                        <label key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={checkedState[key as keyof typeof checkedState]}
                                onChange={() => handleToggle(key as keyof typeof checkedState)}
                                className="w-5 h-5 accent-green-600"
                            />
                            <span className={`text-sm ${checkedState[key as keyof typeof checkedState] ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                                {key === 'ejercicios' && '8 Ejercicios de práctica'}
                                {key === 'miniProyecto' && 'Mini-Proyecto semanal'}
                                {key === 'dma' && (weekData.entregables || 'Diario de Metacognición')}
                                {key === 'commits' && 'Historial de commits organizado'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
