'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import { Review, IRPPagination } from '../../types/irp';

interface ReviewHistoryListProps {
    onViewDetails: (review: Review) => void;
}

export default function ReviewHistoryList({ onViewDetails }: ReviewHistoryListProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/irp/reviews/history?status=${statusFilter}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error fetching history');
            setReviews(data.reviews || []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando historial...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 border rounded-lg">❌ {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border">
                <h3 className="font-bold">📚 Historial de Revisiones</h3>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-1 text-sm">
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                </select>
            </div>

            <div className="grid gap-4">
                {reviews.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">No se encontraron revisiones</div>
                ) : (
                    reviews.map(rev => (
                        <div key={rev.review_id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 transition-all cursor-pointer" onClick={() => onViewDetails(rev)}>
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900">{rev.project_name}</h4>
                                <StatusBadge status={rev.status} />
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 mb-4">
                                <span>Fase {rev.phase}</span>
                                <span>Semana {rev.week}</span>
                                <span>{new Date(rev.created_at || '').toLocaleDateString()}</span>
                            </div>
                            <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-bold text-xs hover:bg-indigo-100">Ver Reporte Detallado</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { icon: string; color: string }> = {
        pending_assignment: { icon: '⏳', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        completed: { icon: '✅', color: 'bg-green-50 text-green-700 border-green-200' },
        in_progress: { icon: '📝', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    };
    const config = configs[status] || { icon: '⚪', color: 'bg-gray-50 text-gray-600' };
    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${config.color} flex items-center gap-1`}>
            {config.icon} {status.replace('_', ' ').toUpperCase()}
        </span>
    );
}
