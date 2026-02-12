'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/observability/Logger';

interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    total_points: number;
    lessons_shared: number;
    upvotes_received: number;
    rank_title: string;
}

const GlobalLeaderboard: React.FC = () => {
    const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async (refresh = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/community/leaderboard${refresh ? '?refresh=true' : ''}`);
            const data = await res.json();
            if (data.success) {
                setRanking(data.data);
            }
        } catch (error) {
            logger.error('Error fetching ranking', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <span className="text-3xl animate-bounce" title="Trophy">🏆</span>;
            case 1: return <span className="text-3xl" title="Silver Medal">🥈</span>;
            case 2: return <span className="text-3xl" title="Bronze Medal">🥉</span>;
            default: return <span className="text-gray-300 font-black text-lg">{index + 1}</span>;
        }
    };

    const getRankBadgeStyle = (title: string) => {
        if (title.includes('Legendario')) return 'bg-rose-500 text-white shadow-rose-200';
        if (title.includes('Experto')) return 'bg-indigo-600 text-white shadow-indigo-200';
        if (title.includes('Avanzado')) return 'bg-blue-100 text-blue-700 shadow-transparent';
        return 'bg-gray-100 text-gray-600 shadow-transparent';
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex flex-row items-center justify-between mb-10 relative z-10">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <span className="text-3xl" role="img" aria-label="Estrella">⭐</span>
                        Salón de la Fama
                    </h2>
                    <p className="text-gray-400 font-bold mt-1 uppercase tracking-tighter text-xs">
                        Los arquitectos del conocimiento más influyentes
                    </p>
                </div>
                <button
                    onClick={() => fetchRanking(true)}
                    disabled={loading}
                    className={`p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl transition-all ${loading ? 'animate-spin' : 'active:scale-95'}`}
                    aria-label="Recargar ranking"
                >
                    <span className="text-xl" role="img" aria-label="Icono de recarga">🔄</span>
                </button>
            </div>

            <div className="relative z-10 overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-4" aria-label="Tabla de ranking global">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-gray-300 border-b border-gray-50">
                            <th className="px-6 pb-2 text-center w-24">Posición</th>
                            <th className="px-6 pb-2">Estudiante</th>
                            <th className="px-6 pb-2">Rango</th>
                            <th className="px-6 pb-2 text-right">Aportes</th>
                            <th className="px-6 pb-2 text-right">Impacto</th>
                            <th className="px-6 pb-2 text-right text-indigo-600">Puntos Totales</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && ranking.length === 0 ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4 bg-gray-50/50 first:rounded-l-2xl last:rounded-r-2xl h-16"></td>
                                    <td className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    <td className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    <td className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    <td className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    <td className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                </tr>
                            ))
                        ) : (
                            ranking.map((entry, index) => (
                                <tr
                                    key={entry.user_id}
                                    className={`group hover:scale-[1.01] transition-all duration-300 ${index < 3 ? 'bg-indigo-50/20' : 'bg-gray-50/30'}`}
                                >
                                    <td className="px-6 py-5 first:rounded-l-[1.5rem] flex items-center justify-center">
                                        {getRankIcon(index)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-black text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">
                                            {entry.display_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg ${getRankBadgeStyle(entry.rank_title)}`}>
                                            {entry.rank_title}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-gray-400">
                                        {entry.lessons_shared} lecc.
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 font-black text-green-500">
                                            <span>+{entry.upvotes_received}</span>
                                            <span>🔼</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right last:rounded-r-[1.5rem]">
                                        <div className="text-xl font-black text-indigo-600 bg-white inline-block px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                                            {entry.total_points.toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!loading && ranking.length === 0 && (
                    <div className="text-center py-20" aria-live="polite">
                        <div className="text-5xl mb-4 text-gray-200" role="img" aria-label="Meta">🏁</div>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Aún no hay pioneros en el ranking</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalLeaderboard;
