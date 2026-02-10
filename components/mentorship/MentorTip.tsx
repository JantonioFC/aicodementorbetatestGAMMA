'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MentorTipProps {
    topic?: string;
}

export default function MentorTip({ topic }: MentorTipProps) {
    const [tip, setTip] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchTip = useCallback(async () => {
        try {
            setLoading(true);
            const url = topic
                ? `/api/v1/mentor/tip?topic=${encodeURIComponent(topic)}`
                : '/api/v1/mentor/tip';
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setTip(data.tip);
            }
        } catch (err) {
            console.error('[MentorTip] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [topic]);

    useEffect(() => {
        fetchTip();
    }, [fetchTip]);

    if (loading) return (
        <div className="animate-pulse flex space-x-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="rounded-full bg-indigo-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-indigo-200 rounded w-3/4"></div>
                <div className="h-2 bg-indigo-200 rounded w-5/6"></div>
            </div>
        </div>
    );

    if (!tip) return null;

    return (
        <div className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-700 p-[1px] rounded-2xl shadow-lg transition-all hover:shadow-indigo-200/50">
            <div className="bg-white rounded-[15px] p-5 flex items-start space-x-4">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-xl text-2xl transform transition-transform group-hover:scale-110 group-hover:rotate-6">
                    🤖
                </div>
                <div className="flex-1">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                        Tip Proactivo del Mentor
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {tip}
                    </p>
                </div>
                <button
                    onClick={fetchTip}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Actualizar consejo"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            {/* Sutil micro-animación de gradiente en el borde */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
    );
}
