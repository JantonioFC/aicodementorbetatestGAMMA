/**
 * Admin Analytics Dashboard
 * Muestra métricas y estadísticas del sistema.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [lessonStats, setLessonStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const [overviewRes, lessonsRes] = await Promise.all([
                fetch('/api/v1/analytics/overview'),
                fetch('/api/v1/analytics/lessons?days=30')
            ]);

            if (!overviewRes.ok || !lessonsRes.ok) {
                throw new Error('Error fetching analytics');
            }

            const overviewData = await overviewRes.json();
            const lessonsData = await lessonsRes.json();

            setOverview(overviewData.data);
            setLessonStats(lessonsData.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Cargando analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-red-400 text-xl">Error: {error}</div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Analytics Dashboard | AI Code Mentor</title>
            </Head>

            <div className="min-h-screen bg-gray-900 text-white p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
                    <p className="text-gray-400 mt-2">Métricas y estadísticas del sistema</p>
                </header>

                {/* Overview Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Lecciones Generadas"
                        value={overview?.overview?.lessons?.total || 0}
                        subtitle={`Score promedio: ${overview?.overview?.lessons?.avgScore || 0}`}
                        icon="📚"
                        color="blue"
                    />
                    <StatCard
                        title="Sesiones Activas"
                        value={overview?.overview?.sessions?.active || 0}
                        subtitle={`${overview?.overview?.sessions?.totalUsers || 0} usuarios totales`}
                        icon="👥"
                        color="green"
                    />
                    <StatCard
                        title="Feedback Recibido"
                        value={overview?.overview?.feedback?.total || 0}
                        subtitle={`Rating promedio: ${overview?.overview?.feedback?.avgRating || 0}⭐`}
                        icon="💬"
                        color="yellow"
                    />
                    <StatCard
                        title="Tasa de Aprobación"
                        value={`${overview?.evaluationMetrics?.totals?.passRate || 0}%`}
                        subtitle={`${overview?.evaluationMetrics?.totals?.evaluations || 0} evaluaciones`}
                        icon="✅"
                        color="purple"
                    />
                </section>

                {/* Evaluation Metrics */}
                <section className="bg-gray-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">📈 Métricas de Evaluación</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {overview?.evaluationMetrics?.components && Object.entries(overview.evaluationMetrics.components).map(([key, value]) => (
                            <MetricBar
                                key={key}
                                label={formatMetricLabel(key)}
                                value={value}
                            />
                        ))}
                    </div>
                </section>

                {/* Score Distribution */}
                <section className="bg-gray-800 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">📊 Distribución de Scores</h2>
                    <div className="space-y-3">
                        {lessonStats?.scoreDistribution?.map((item) => (
                            <div key={item.grade} className="flex items-center gap-4">
                                <span className="w-24 text-sm">{item.grade}</span>
                                <div className="flex-1 bg-gray-700 rounded-full h-6">
                                    <div
                                        className={`h-6 rounded-full ${getGradeColor(item.grade)}`}
                                        style={{ width: `${Math.min(100, item.count * 5)}%` }}
                                    />
                                </div>
                                <span className="w-16 text-right">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Activity by Week */}
                <section className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">📅 Actividad por Semana del Currículo</h2>
                    <div className="flex flex-wrap gap-2">
                        {lessonStats?.activityByWeek?.map((item) => (
                            <div
                                key={item.semana}
                                className="px-3 py-2 bg-blue-600 rounded text-sm"
                                title={`${item.interactions} interacciones`}
                            >
                                S{item.semana}: {item.interactions}
                            </div>
                        ))}
                        {(!lessonStats?.activityByWeek || lessonStats.activityByWeek.length === 0) && (
                            <p className="text-gray-500">No hay datos de actividad aún</p>
                        )}
                    </div>
                </section>

                {/* Refresh Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={fetchAnalytics}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        🔄 Actualizar Datos
                    </button>
                </div>
            </div>
        </>
    );
}

// Componentes auxiliares

function StatCard({ title, value, subtitle, icon, color }) {
    const colors = {
        blue: 'from-blue-600 to-blue-800',
        green: 'from-green-600 to-green-800',
        yellow: 'from-yellow-600 to-yellow-800',
        purple: 'from-purple-600 to-purple-800'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6`}>
            <div className="flex items-center justify-between">
                <span className="text-3xl">{icon}</span>
                <span className="text-3xl font-bold">{value}</span>
            </div>
            <h3 className="mt-4 font-medium">{title}</h3>
            <p className="text-sm opacity-75">{subtitle}</p>
        </div>
    );
}

function MetricBar({ label, value }) {
    const getBarColor = (val) => {
        if (val >= 80) return 'bg-green-500';
        if (val >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="bg-gray-700 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${getBarColor(value)}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

function formatMetricLabel(key) {
    const labels = {
        faithfulness: 'Fidelidad',
        relevance: 'Relevancia',
        length: 'Longitud',
        structure: 'Estructura',
        noHallucination: 'Sin Alucinación'
    };
    return labels[key] || key;
}

function getGradeColor(grade) {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    if (grade.startsWith('D')) return 'bg-orange-500';
    return 'bg-red-500';
}
