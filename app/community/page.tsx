'use client';

import React, { useState, Suspense, lazy } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';

// Lazy loading components
const SharedLessonGallery = lazy(() => import('@/components/community/SharedLessonGallery'));
const GlobalLeaderboard = lazy(() => import('@/components/community/GlobalLeaderboard'));

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState('lessons');

    const tabs = [
        { id: 'lessons', label: 'Comunidad', icon: '🌍' },
        { id: 'leaderboard', label: 'Ranking', icon: '🏆' },
    ];

    return (
        <ProtectedRoute>
            <PrivateLayout title="Comunidad" description="Aprende y crece con tus compañeros del Ecosistema 360">
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
                        <Suspense fallback={<div className="p-20 text-center animate-pulse font-black text-gray-200 text-4xl">CARGANDO...</div>}>
                            {activeTab === 'lessons' && <SharedLessonGallery />}
                            {activeTab === 'leaderboard' && <GlobalLeaderboard />}
                        </Suspense>
                    </div>
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
