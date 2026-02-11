'use client';

import React, { useState, Suspense, lazy } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';

// Lazy loading components
const ProgressDashboard = lazy(() => import('@/components/dashboard/ProgressDashboard'));
const AchievementsWidget = lazy(() => import('@/components/dashboard/AchievementsWidget'));
const EnhancedUnifiedDashboard = lazy(() => import('@/components/ProjectTracking/EnhancedUnifiedDashboard'));
const SandboxWidget = lazy(() => import('@/components/Sandbox/SandboxWidget'));
const SystemTestWidget = lazy(() => import('@/components/dashboard/SystemTestWidget'));
const LearningPathMap = lazy(() => import('@/components/autonomy/LearningPathMap'));

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('progress');

    const tabs = [
        { id: 'progress', label: 'Progreso', icon: '📊' },
        { id: 'unified', label: 'Métricas 360', icon: '📈' },
        { id: 'autonomy', label: 'Ruta IA', icon: '🚀' },
        { id: 'achievements', label: 'Logros', icon: '🏆' },
        { id: 'sandbox', label: 'Sandbox', icon: '🧪' },
        { id: 'system', label: 'Sistema', icon: '🔧' },
    ];

    return (
        <ProtectedRoute>
            <PrivateLayout title="Panel de Control" description="Tu centro de mando en el Ecosistema 360">
                <div className="max-w-7xl mx-auto space-y-8">
                    <nav className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <span>{t.icon}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Suspense fallback={<div className="p-20 text-center animate-pulse font-black text-gray-200 text-4xl">CARGANDO MÓDULO...</div>}>
                            {activeTab === 'progress' && <ProgressDashboard />}
                            {activeTab === 'unified' && <EnhancedUnifiedDashboard />}
                            {activeTab === 'autonomy' && <LearningPathMap />}
                            {activeTab === 'achievements' && <AchievementsWidget />}
                            {activeTab === 'sandbox' && <SandboxWidget />}
                            {activeTab === 'system' && <SystemTestWidget />}
                        </Suspense>
                    </div>
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
