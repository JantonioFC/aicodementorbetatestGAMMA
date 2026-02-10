'use client';

import React, { useEffect, useState } from 'react';

interface MasteryData {
    overallStats: {
        totalLogCount: number;
        masteredCount: number;
        uniqueCompetencies: number;
    };
    categoryProgress: Array<{
        category: string;
        count: number;
        avgLevel: number;
    }>;
    recentMastery: Array<{
        competency: string;
        level: number;
        date: string;
    }>;
    topMasteries: Array<{
        competency: string;
        level: number;
    }>;
    recommendations: string[];
}

export default function MasteryDashboard() {
    const [data, setData] = useState<MasteryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMastery = async () => {
            try {
                const response = await fetch('/api/v1/analytics/mastery');
                if (!response.ok) throw new Error('Error al cargar analíticas');
                const json = await response.json();
                setData(json.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMastery();
    }, []);

    const getLevelBadge = (level: number) => {
        if (level >= 3) return "bg-purple-100 text-purple-700 border-purple-200";
        if (level >= 2) return "bg-blue-100 text-blue-700 border-blue-200";
        return "bg-green-100 text-green-700 border-green-200";
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Analizando tu maestría...</span>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            ❌ Error: {error}
        </div>
    );

    if (!data || data.overallStats.totalLogCount === 0) return (
        <div className="p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-bold text-gray-800">¡Tu viaje de maestría comienza aquí!</h3>
            <p className="text-gray-600 mt-2">Completa lecciones y aprueba quizzes para ver tus competencias.</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Resumen Superior */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-2xl">📚</div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{data.overallStats.totalLogCount}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hitos Registrados</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg text-2xl">💎</div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{data.overallStats.masteredCount}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Maestrías (Lvl 3+)</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg text-2xl">🎯</div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{data.overallStats.uniqueCompetencies}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habilidades Únicas</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progreso por Categoría */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
                        <span className="mr-2">📈</span> Progreso por Categoría
                    </h3>
                    <div className="space-y-6">
                        {data.categoryProgress.map((cat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-gray-700">{cat.category}</span>
                                    <span className="text-blue-600">Nivel {cat.avgLevel} / 3</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                                        style={{ width: `${(cat.avgLevel / 3) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{cat.count} interacciones</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Habilidades */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center">
                        <span className="mr-2">🏆</span> Habilidades Destacadas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.topMasteries.map((skill, i) => (
                            <div
                                key={i}
                                className={`px-4 py-2 rounded-full border-2 text-sm font-black flex items-center transition-all hover:scale-105 ${getLevelBadge(skill.level)}`}
                            >
                                {skill.competency}
                                <span className="ml-2 text-[10px] opacity-70">LVL {skill.level}</span>
                            </div>
                        ))}
                    </div>

                    {data.recommendations.length > 0 && (
                        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                            <h4 className="text-sm font-black text-amber-800 mb-2 flex items-center uppercase tracking-tight">
                                <span className="mr-2">💡</span> Áreas de Enfoque Recomendadas
                            </h4>
                            <ul className="space-y-1">
                                {data.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-amber-700 flex items-start">
                                        <span className="mr-2">•</span> {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-black text-gray-800 flex items-center">
                        <span className="mr-2">🕒</span> Actividad de Logros Reciente
                    </h3>
                </div>
                <div className="divide-y">
                    {data.recentMastery.map((item, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="text-xl">⭐</div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{item.competency}</div>
                                    <div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getLevelBadge(item.level)}`}>
                                Nivel {item.level}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
