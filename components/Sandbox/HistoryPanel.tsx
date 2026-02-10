'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/useAuth';

interface Generation {
    id: string;
    title: string;
    custom_content: string;
    generated_lesson: any;
    created_at: string;
}

interface HistoryPanelProps {
    onRestoreGeneration: (generation: Generation) => void;
}

export default function HistoryPanel({ onRestoreGeneration }: HistoryPanelProps) {
    const { session } = useAuth();
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchHistory = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/sandbox/history');
            const data = await response.json();
            setGenerations(data.data?.generations || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [session]);

    const filtered = generations.filter(gen =>
        gen.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!session) return <div className="p-6 border rounded-xl bg-gray-50 text-center text-sm">🔒 Inicia sesión para ver tu historial</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-indigo-600 text-white p-4">
                <h3 className="font-bold flex items-center gap-2">📜 Historial</h3>
            </div>

            <div className="p-4 border-b">
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm border rounded p-2"
                />
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y">
                {isLoading ? (
                    <div className="p-6 text-center animate-pulse">Cargando...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No hay generaciones</div>
                ) : (
                    filtered.map(gen => (
                        <div key={gen.id} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === gen.id ? null : gen.id)}>
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{gen.title}</h4>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(gen.created_at).toLocaleDateString()}</span>
                            </div>
                            {expandedId === gen.id && (
                                <div className="mt-3 animate-in slide-in-from-top-2">
                                    <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 p-2 rounded mb-3">{gen.custom_content}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRestoreGeneration(gen); }}
                                        className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold"
                                    >
                                        Restaurar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
