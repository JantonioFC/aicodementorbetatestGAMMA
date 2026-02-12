'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import ReviewRequestForm from '@/components/irp/ReviewRequestForm';
import ReviewHistoryList from '@/components/irp/ReviewHistoryList';
import ReviewReportView from '@/components/irp/ReviewReportView';
import { useAuth } from '@/lib/auth/useAuth';
import { useUserMetrics } from '@/hooks/useUserMetrics';
import { Review } from '@/types/irp';

const TrendChart = dynamic(() => import('@/components/common/charts/TrendChart'), { ssr: false });
const QualityGauge = dynamic(() => import('@/components/common/charts/QualityGauge'), { ssr: false });
const ComparisonBar = dynamic(() => import('@/components/common/charts/ComparisonBar'), { ssr: false });
const TimelineChart = dynamic(() => import('@/components/common/charts/TimelineChart'), { ssr: false });

type View = 'dashboard' | 'request' | 'history' | 'view-report';

interface ActionCardProps {
    title: string;
    desc: string;
    btn: string;
    onClick: () => void;
}

export default function PeerReviewClient() {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

    const { metrics, loading: metricsLoading } = useUserMetrics(user?.id);

    const handleViewDetails = (review: Review) => {
        setSelectedReviewId(review.review_id);
        setActiveView('view-report');
    };

    return (
        <ProtectedRoute>
            <PrivateLayout title="Revision por Pares IA">
                <div className="max-w-6xl mx-auto space-y-8">
                    {activeView === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-3xl text-white shadow-xl">
                                <h1 className="text-4xl font-black mb-2">🤖 Code Review IA</h1>
                                <p className="text-indigo-100 italic">Auditoría automática basada en estándares industriales y de currículum.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border">
                                <QualityGauge
                                    score={(metrics?.reviewer_metrics?.average_rating_given || 0) * 20}
                                    label="Calidad de Código"
                                />
                                <TrendChart
                                    data={[]}
                                    title="Calidad de Código"
                                />
                                <ComparisonBar
                                    value={metrics?.reviewer_metrics?.total_reviews_completed || 0}
                                    avgValue={10}
                                    label="Revisiones Realizadas"
                                />
                                <TimelineChart
                                    events={[]}
                                    title="Actividad Mensual"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ActionCard
                                    title="Nueva Auditoría"
                                    desc="Sube tu código para recibir feedback instantáneo de la IA."
                                    btn="Iniciar ahora"
                                    onClick={() => setActiveView('request')}
                                />
                                <ActionCard
                                    title="Historial"
                                    desc="Consulta tus reportes anteriores y el progreso de tus mejoras."
                                    btn="Ver archivo"
                                    onClick={() => setActiveView('history')}
                                />
                            </div>
                        </div>
                    )}

                    {activeView === 'request' && (
                        <div className="space-y-6">
                            <button onClick={() => setActiveView('dashboard')} className="text-indigo-600 font-bold mb-4 flex gap-2 items-center">← Dashboard</button>
                            <ReviewRequestForm onSuccess={() => setActiveView('history')} />
                        </div>
                    )}

                    {activeView === 'history' && (
                        <div className="space-y-6">
                            <button onClick={() => setActiveView('dashboard')} className="text-indigo-600 font-bold mb-4 flex gap-2 items-center">← Dashboard</button>
                            <ReviewHistoryList onViewDetails={handleViewDetails} />
                        </div>
                    )}

                    {activeView === 'view-report' && (
                        <ReviewReportView
                            reviewId={selectedReviewId}
                            onClose={() => setActiveView('history')}
                        />
                    )}
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}

function ActionCard({ title, desc, btn, onClick }: ActionCardProps) {
    return (
        <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all">
            <h3 className="text-2xl font-black mb-2">{title}</h3>
            <p className="text-gray-500 mb-6">{desc}</p>
            <button onClick={onClick} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">{btn}</button>
        </div>
    );
}
