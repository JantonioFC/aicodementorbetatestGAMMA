'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/observability/Logger';

interface SharedLesson {
    id: string;
    owner_id: string;
    display_name: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    votes_score: number;
    views_count: number;
    user_vote?: number;
    created_at: string;
}

const SharedLessonGallery: React.FC = () => {
    const [lessons, setLessons] = useState<SharedLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'latest' | 'top'>('latest');

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/v1/community/feed?sort=${filter}`);
                const data = await res.json();
                if (data.success) {
                    setLessons(data.data);
                }
            } catch (error) {
                logger.error('Error fetching feed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [filter]);

    const handleVote = async (sharedId: string, value: number) => {
        try {
            const res = await fetch('/api/v1/community/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sharedId, value })
            });
            const data = await res.json();
            if (data.success) {
                // Update local state for immediate feedback
                setLessons(prev => prev.map(l => {
                    if (l.id === sharedId) {
                        const oldVote = l.user_vote || 0;
                        const scoreDiff = value - oldVote;
                        return { ...l, user_vote: value, votes_score: l.votes_score + scoreDiff };
                    }
                    return l;
                }));
            }
        } catch (error) {
            logger.error('Error voting', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 p-6 rounded-[2rem] border border-white/20 backdrop-blur-sm">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    <button
                        onClick={() => setFilter('latest')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filter === 'latest' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        RECIENTES
                    </button>
                    <button
                        onClick={() => setFilter('top')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filter === 'top' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        POPULARES
                    </button>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-4 py-2 rounded-full">
                    Mostrando {lessons.length} lecciones compartidas
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-[2.5rem] p-8 h-80 animate-pulse border border-gray-100"></div>
                    ))
                ) : (
                    lessons.map(lesson => (
                        <div key={lesson.id} className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 hover:border-indigo-100 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.1)] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className="bg-gray-900 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">{lesson.category}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 text-[10px] font-bold">👁️ {lesson.views_count}</span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-gray-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
                            <p className="text-gray-400 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{lesson.description}</p>

                            <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                                {lesson.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-1 rounded-md">#{tag}</span>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
                                        {lesson.display_name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-gray-800 lowercase tracking-tight">@{lesson.display_name.replace(/\s+/g, '')}</span>
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Colaborador</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                    <button
                                        onClick={() => handleVote(lesson.id, 1)}
                                        className={`p-2 rounded-xl transition-all ${lesson.user_vote === 1 ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-300 hover:text-indigo-400'}`}
                                        aria-label="Votar a favor"
                                    >
                                        <span className="text-sm font-black" role="img" aria-label="Flecha arriba">🔼</span>
                                    </button>
                                    <span className={`text-sm font-black px-1 ${lesson.votes_score > 0 ? 'text-green-500' : 'text-gray-400'}`} aria-label={`${lesson.votes_score} votos`}>
                                        {lesson.votes_score}
                                    </span>
                                    <button
                                        onClick={() => handleVote(lesson.id, -1)}
                                        className={`p-2 rounded-xl transition-all ${lesson.user_vote === -1 ? 'bg-white text-rose-500 shadow-md' : 'text-gray-300 hover:text-rose-400'}`}
                                        aria-label="Votar en contra"
                                    >
                                        <span className="text-sm font-black" role="img" aria-label="Flecha abajo">🔽</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SharedLessonGallery;
