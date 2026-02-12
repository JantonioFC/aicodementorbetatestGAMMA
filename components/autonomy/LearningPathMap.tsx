'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/observability/Logger';

interface PathStep {
    id: string;
    step_number: number;
    topic: string;
    estimated_difficulty: string;
    resource_type: string;
    reasoning: string;
    status: 'pending' | 'completed' | 'current';
}

interface LearningPath {
    id: string;
    title: string;
    target_profile: string;
    status: string;
    current_step_index: number;
    steps: PathStep[];
}

const LearningPathMap: React.FC = () => {
    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivePath();
    }, []);

    const fetchActivePath = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/autonomy/active-path');
            const data = await res.json();
            if (data.success && data.data) {
                setPath(data.data);
            }
        } catch (error) {
            logger.error('Error fetching path', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/autonomy/generate-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetProfile: 'frontend-starter' })
            });
            const data = await res.json();
            if (data.success) {
                fetchActivePath();
            }
        } catch (error) {
            logger.error('Error generating path', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !path) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="text-4xl animate-pulse">✨</div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Escaneando brechas de conocimiento...</p>
            </div>
        );
    }

    if (!path) {
        return (
            <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-gray-100 p-12 text-center max-w-2xl mx-auto overflow-hidden relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50"></div>

                <div className="relative z-10">
                    <div className="text-6xl mb-6">🚀</div>
                    <h2 className="text-3xl font-black text-gray-800 mb-4">¿Listo para tu Ruta Personalizada?</h2>
                    <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                        Nuestro motor de IA analizará tu progreso actual y generará un camino optimizado para que alcances el nivel de
                        <span className="text-indigo-600 font-black mx-1">Frontend Developer (Junior)</span>.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="group flex items-center gap-3 bg-gray-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-lg transition-all shadow-2xl shadow-gray-200 active:scale-95"
                    >
                        GENERAR MI RUTA IA
                        <span className="group-hover:rotate-12 transition-transform">✨</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-200">🎯 Objetivo Activo</span>
                    </div>
                    <h2 className="text-4xl font-black mb-3">{path.title}</h2>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                            <span>✅</span>
                            {path.steps.filter(s => s.status === 'completed').length} / {path.steps.length} Completados
                        </div>
                    </div>
                </div>

                <div className="relative z-10 bg-white/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                    <div className="text-center">
                        <div className="text-3xl font-black mb-1">
                            {Math.round((path.steps.filter(s => s.status === 'completed').length / path.steps.length) * 100)}%
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Dominio de Ruta</div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-10 relative">
                {/* Connecting Line */}
                <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 via-violet-400 to-gray-100 -translate-x-1/2 rounded-full opacity-20 hidden md:block"></div>
                <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 via-violet-400 to-gray-100 rounded-full opacity-20 md:hidden"></div>

                <div className="space-y-16">
                    {path.steps.map((step, index) => {
                        const isEven = index % 2 === 0;
                        const isCurrent = index === path.current_step_index;
                        const isCompleted = index < path.current_step_index;
                        const isLocked = index > path.current_step_index;

                        return (
                            <div key={step.id} className={`flex flex-col md:flex-row items-start md:items-center relative ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                                {/* Timeline Bullet */}
                                <div className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 w-20 h-20 flex items-center justify-center bg-white rounded-3xl z-20 shadow-xl border-4 transition-all duration-500
                                    ${isCompleted ? 'border-indigo-500 scale-90' : isCurrent ? 'border-yellow-400 scale-110 shadow-yellow-100' : 'border-gray-50 scale-100 opacity-50'}
                                `}>
                                    {isCompleted ? <span className="text-4xl text-indigo-500">✅</span> :
                                        isCurrent ? <span className="text-4xl animate-pulse">▶️</span> :
                                            <span className="text-4xl opacity-20">🔒</span>}
                                </div>

                                {/* Content Card */}
                                <div className={`w-full md:w-[42%] ml-24 md:ml-0 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                                    <div className={`p-8 bg-white rounded-[2rem] border transition-all duration-300 relative
                                        ${isCurrent ? 'border-yellow-200 shadow-[0_20px_50px_rgba(250,204,21,0.2)]' : 'border-gray-50 grayscale hover:grayscale-0'}
                                    `}>
                                        {isCurrent && (
                                            <div className="absolute -top-3 -left-3 bg-yellow-400 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                Siguiente Paso
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                                ${step.estimated_difficulty === 'advanced' ? 'bg-rose-50 text-rose-600' :
                                                    step.estimated_difficulty === 'intermediate' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-green-50 text-green-600'}
                                            `}>
                                                {step.estimated_difficulty}
                                            </span>
                                            <div className="text-[10px] font-black text-gray-300 uppercase">Paso {step.step_number}</div>
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-800 mb-3 leading-tight">{step.topic}</h3>

                                        <div className="bg-indigo-50/50 p-4 rounded-2xl mb-6 relative border border-indigo-100">
                                            <div className="flex gap-2 mb-2 items-center">
                                                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">💡 IA Reasoning</span>
                                            </div>
                                            <p className="text-xs text-indigo-600 font-bold leading-relaxed italic">
                                                &ldquo;{step.reasoning}&rdquo;
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase">
                                                <span>{step.resource_type === 'lesson' ? '📖' : '💻'}</span>
                                                {step.resource_type}
                                            </div>
                                            <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all
                                                ${isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-indigo-600 shadow-xl shadow-gray-100 active:scale-95'}
                                            `}>
                                                {isCompleted ? 'REPASAR' : isCurrent ? 'CONTINUAR' : 'BLOQUEADO'}
                                                {!isLocked && <span>→</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LearningPathMap;
