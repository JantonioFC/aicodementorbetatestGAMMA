'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserMetrics } from '../types/irp';

interface UseUserMetricsOptions {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
    autoRefresh?: boolean;
    refreshInterval?: number;
    token?: string | null;
}

export function useUserMetrics(userId: string | undefined, options: UseUserMetricsOptions = {}) {
    const {
        period = 'month',
        autoRefresh = true,
        refreshInterval = 300000,
        token = null
    } = options;

    const [metrics, setMetrics] = useState<UserMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchMetrics = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const params = new URLSearchParams({ period });
            const res = await fetch(`/api/v1/irp/reviews/metrics/${userId}?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);
            setMetrics(await res.json());
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [userId, period, token]);

    useEffect(() => {
        fetchMetrics();
        if (autoRefresh) {
            const id = setInterval(fetchMetrics, refreshInterval);
            return () => clearInterval(id);
        }
    }, [fetchMetrics, autoRefresh, refreshInterval]);

    return { metrics, loading, error, refresh: fetchMetrics };
}

export function useInsights(metrics: UserMetrics | null) {
    if (!metrics) return [];

    const insights: any[] = [];
    const { reviewer_metrics, author_metrics } = metrics;

    if (reviewer_metrics && reviewer_metrics.quality_score >= 4.5) {
        insights.push({
            type: 'success',
            message: 'Tu calidad como revisor es excelente (Top 10%).',
            action: 'Ver insignia'
        });
    }

    if (reviewer_metrics && reviewer_metrics.average_review_time_hours > 48) {
        insights.push({
            type: 'warning',
            message: 'El tiempo promedio de revisión es alto (> 48h).',
            action: 'Ver tips de productividad'
        });
    }

    if (author_metrics && author_metrics.response_to_feedback_rate < 0.8) {
        insights.push({
            type: 'info',
            message: 'Tip: Responder al feedback mejora tu visibilidad.',
            action: 'Ver comentarios pendientes'
        });
    }

    return insights;
}

interface UseReviewHistoryFilters {
    role: string;
    status: string;
    sortBy: string;
    sortOrder: string;
    limit: number;
    token?: string | null;
}

export function useReviewHistory(filters: UseReviewHistoryFilters) {
    const [history, setHistory] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        total_reviews: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchHistory = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: filters.limit.toString(),
                role: filters.role,
                status: filters.status,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });

            const res = await fetch(`/api/v1/irp/reviews/history?${queryParams}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(filters.token && { 'Authorization': `Bearer ${filters.token}` })
                }
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);

            const data = await res.json();
            setHistory(data.reviews || []);
            setPagination(data.pagination || {
                current_page: 1,
                total_pages: 1,
                has_next: false,
                has_prev: false,
                total_reviews: 0
            });
            setError(null);
        } catch (err) {
            setError(err);
            // Fallback for demo/dev if API fails
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchHistory(1);
    }, [fetchHistory]);

    const loadNextPage = () => {
        if (pagination.has_next) fetchHistory(pagination.current_page + 1);
    };

    const loadPrevPage = () => {
        if (pagination.has_prev) fetchHistory(pagination.current_page - 1);
    };

    return {
        history,
        pagination,
        loading,
        error,
        loadNextPage,
        loadPrevPage,
        refresh: () => fetchHistory(pagination.current_page)
    };
}
