'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AcademicCapIcon, CodeBracketIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useStreamingLesson } from '../../hooks/useStreamingLesson';

interface SelectedPomodoro {
    dia: number;
    pomodoroIndex: number;
    label: string;
}

export interface DayData {
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
    const [selectedPomodoro, setSelectedPomodoro] = useState<SelectedPomodoro | null>(null);
    const { streamLesson, reset, isStreaming, content, quiz, error } = useStreamingLesson();
    const lessonPanelRef = useRef<HTMLDivElement>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    const [quizChecked, setQuizChecked] = useState(false);

    // Strip quiz JSON from displayed content — always recomputed from latest content
    const displayContent = useMemo(() => {
        if (!content) return '';
        // Remove everything from ---QUIZ--- onwards (including variations with spaces)
        return content.replace(/\n*---\s*QUIZ\s*---[\s\S]*$/i, '').trim();
    }, [content]);

    const handlePomodoroClick = (dia: number, pomodoroIndex: number, label: string) => {
        const isSame = selectedPomodoro?.dia === dia && selectedPomodoro?.pomodoroIndex === pomodoroIndex;
        if (isSame && !error) return;

        setSelectedPomodoro({ dia, pomodoroIndex, label });
        reset();
        setQuizAnswers({});
        setQuizChecked(false);
        streamLesson({ semanaId: weekData.semana, dia, pomodoroIndex });
        setTimeout(() => lessonPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    };

    const handleClose = () => {
        setSelectedPomodoro(null);
        reset();
    };

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
        dia: dia.dia,
        day: `Día ${dia.dia}`,
        theme: dia.concepto,
        blocks: [
            {
                title: "Adquisición",
                startIndex: 0,
                bgColor: "bg-slate-800",
                textColor: "text-white",
                icon: AcademicCapIcon,
                pomodoros: dia.pomodoros.slice(0, 2)
            },
            {
                title: "Aplicación",
                startIndex: 2,
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
                                        {block.pomodoros.map((p, pIdx) => {
                                            const globalIdx = block.startIndex + pIdx;
                                            const isSelected = selectedPomodoro?.dia === day.dia && selectedPomodoro?.pomodoroIndex === globalIdx;
                                            return (
                                                <button
                                                    key={pIdx}
                                                    onClick={() => handlePomodoroClick(day.dia, globalIdx, p)}
                                                    className={`w-full text-left text-[11px] leading-tight flex gap-1 p-1 rounded transition-all ${
                                                        isSelected
                                                            ? 'bg-indigo-500 ring-2 ring-indigo-300'
                                                            : 'hover:bg-white/10 cursor-pointer'
                                                    }`}
                                                >
                                                    <span>{isSelected && isStreaming ? '⏳' : '🎯'}</span> {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedPomodoro && (
                <div ref={lessonPanelRef} className="bg-white border border-indigo-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
                        <div className="text-white">
                            <span className="text-xs opacity-80">Día {selectedPomodoro.dia} &middot; Pomodoro {selectedPomodoro.pomodoroIndex + 1}</span>
                            <h4 className="font-bold text-sm">{selectedPomodoro.label}</h4>
                        </div>
                        <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-5">
                        {isStreaming && !displayContent && (
                            <div className="flex items-center gap-3 text-indigo-600">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span className="text-sm">Generando leccion...</span>
                            </div>
                        )}
                        {displayContent && (
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
                                {displayContent}
                                {isStreaming && <span className="animate-pulse ml-1">|</span>}
                            </div>
                        )}
                        {quiz.length > 0 && !isStreaming && (
                            <div className="mt-6 border-t border-gray-200 pt-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-bold text-gray-900 text-base">Verifica tu comprension</h5>
                                    {quizChecked && (
                                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                            quiz.filter((q, i) => quizAnswers[i] === q.respuesta_correcta).length === quiz.length
                                                ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {quiz.filter((q, i) => quizAnswers[i] === q.respuesta_correcta).length}/{quiz.length} correctas
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {quiz.map((q, qIdx) => {
                                        const selected = quizAnswers[qIdx];
                                        const isCorrect = selected === q.respuesta_correcta;
                                        return (
                                            <div key={qIdx} className={`rounded-lg p-4 border ${
                                                quizChecked
                                                    ? isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}>
                                                <p className="font-medium text-sm text-gray-900 mb-3">{qIdx + 1}. {q.pregunta}</p>
                                                <div className="space-y-2 ml-4">
                                                    {(q.opciones || []).map((op, oIdx) => {
                                                        const isThis = selected === op;
                                                        const isAnswer = q.respuesta_correcta === op;
                                                        let style = 'text-gray-900 hover:bg-gray-100';
                                                        if (quizChecked) {
                                                            if (isAnswer) style = 'bg-green-100 text-green-900 font-medium';
                                                            else if (isThis) style = 'bg-red-100 text-red-800 line-through';
                                                            else style = 'text-gray-400';
                                                        } else if (isThis) {
                                                            style = 'bg-indigo-100 text-indigo-900 font-medium';
                                                        }
                                                        return (
                                                            <label key={oIdx} className={`flex items-center gap-3 text-sm p-2 rounded-md cursor-pointer transition-colors ${style}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`quiz-${selectedPomodoro?.dia}-${selectedPomodoro?.pomodoroIndex}-${qIdx}`}
                                                                    checked={isThis}
                                                                    disabled={quizChecked}
                                                                    onChange={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: op }))}
                                                                    className="accent-indigo-600 w-4 h-4 shrink-0"
                                                                />
                                                                <span>{op}</span>
                                                                {quizChecked && isAnswer && <span className="ml-auto text-green-600 text-xs font-medium">Correcta</span>}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-5">
                                    {!quizChecked ? (
                                        <button
                                            onClick={() => setQuizChecked(true)}
                                            disabled={Object.keys(quizAnswers).length < quiz.length}
                                            className={`px-5 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                                                Object.keys(quizAnswers).length < quiz.length
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                        >
                                            Revisar respuestas ({Object.keys(quizAnswers).length}/{quiz.length})
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { setQuizAnswers({}); setQuizChecked(false); }}
                                            className="px-5 py-2.5 text-sm rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            Reintentar quiz
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="text-center py-4">
                                <p className="text-red-600 text-sm mb-3">Error: {error}</p>
                                <button
                                    onClick={() => {
                                        reset();
                                        streamLesson({ semanaId: weekData.semana, dia: selectedPomodoro.dia, pomodoroIndex: selectedPomodoro.pomodoroIndex });
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
