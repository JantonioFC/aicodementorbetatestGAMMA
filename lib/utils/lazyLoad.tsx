import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Utilidades de Lazy Loading para AI Code Mentor
 */

export interface LazyLoadOptions {
    loading?: React.ReactNode | null;
    ssr?: boolean;
}

const DefaultLoader = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

export function lazyLoad<T = any>(importFn: () => Promise<{ default: React.ComponentType<T> }>, options: LazyLoadOptions = {}) {
    const {
        loading: LoadingComponent = DefaultLoader,
        ssr = false,
    } = options;

    return dynamic(importFn, {
        loading: () => <>{LoadingComponent}</>,
        ssr
    });
}

export function lazyLoadChart<T = any>(importFn: () => Promise<{ default: React.ComponentType<T> }>) {
    return lazyLoad(importFn, { ssr: false });
}

export const LazyComponents = {
    TrendChart: lazyLoadChart(() => import('../../components/common/charts/TrendChart')),
    EnhancedDashboard: lazyLoad(() => import('../../components/dashboard/EnhancedProgressDashboard'))
};

export function PreloadOnHover({ load, children }: { load: () => Promise<unknown>; children: React.ReactNode }): React.JSX.Element {
    const handleMouseEnter = () => {
        load().catch(() => { });
    };

    return (
        <div onMouseEnter={handleMouseEnter}>
            {children}
        </div>
    );
}
