'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import EnhancedProgressDashboard from '@/components/dashboard/EnhancedProgressDashboard';
import AchievementsWidget from '@/components/dashboard/AchievementsWidget';
import MasteryDashboard from '@/components/dashboard/MasteryDashboard';

export default function AnaliticasClient() {
    const [activeTab, setActiveTab] = useState<'progress' | 'achievements' | 'mastery'>('progress');

    const tabs = [
        { id: 'progress', label: 'Dashboard de Progreso', icon: '📊' },
        { id: 'mastery', label: 'Maestría y Competencias', icon: '🎓' },
        { id: 'achievements', label: 'Sistema de Logros', icon: '🏆' },
    ] as const;

    return (
        <ProtectedRoute>
            <PrivateLayout
                title="Analíticas Detalladas - AI Code Mentor"
                description="Estadísticas granulares e historiales del Ecosistema 360"
            >
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-lg p-6 border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Analíticas Detalladas</h1>
                                <p className="text-gray-600">Estadísticas granulares • Historiales de progreso • Métricas de competencias</p>
                            </div>
                            <div className="text-4xl">📈</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="bg-white rounded-xl shadow-sm border p-1 flex space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'progress' | 'achievements')}
                                className={`flex-1 flex items-center justify-center py-3 px-6 rounded-lg font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[500px] transition-all duration-300">
                        {activeTab === 'progress' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">📊 Dashboard de Progreso</h2>
                                    <p className="text-sm text-gray-500">Visualización multidimensional del progreso educativo</p>
                                </div>
                                <EnhancedProgressDashboard />
                            </div>
                        )}
                        {activeTab === 'mastery' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">🎓 Maestría y Competencias</h2>
                                    <p className="text-sm text-gray-500">Tu perfil dinámico de habilidades y conocimientos</p>
                                </div>
                                <MasteryDashboard />
                            </div>
                        )}
                        {activeTab === 'achievements' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">🏆 Sistema de Logros</h2>
                                    <p className="text-sm text-gray-500">Framework de gamificación y reconocimientos</p>
                                </div>
                                <AchievementsWidget />
                            </div>
                        )}
                    </div>
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
