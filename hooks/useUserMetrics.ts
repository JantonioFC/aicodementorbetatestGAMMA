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
