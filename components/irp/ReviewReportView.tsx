'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import LessonFeedback from '../common/LessonFeedback';
import { ReviewReport } from '../../types/irp';

interface ReviewReportViewProps {
    reviewId: string | null;
    onClose?: () => void;
}

export default function ReviewReportView({ reviewId, onClose }: ReviewReportViewProps) {
    const { user } = useAuth();
    const [review, setReview] = useState<ReviewReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        async function fetchDetails() {
            if (!reviewId) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/v1/irp/reviews/${reviewId}`);
                if (!res.ok) throw new Error('Error al cargar reporte');
                setReview(await res.json());
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [reviewId]);

    const handleDownload = async () => {
        if (!review) return;
        try {
            setIsExporting(true);
            const res = await fetch(`/api/v1/export/markdown?id=${review.review_id}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Review-${review.review_id}.md`;
            a.click();
        } catch (err) {
            alert('Error al exportar');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Analizando reporte...</div>;
    if (!review) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-900">Auditoría IA</h2>
                <div className="flex gap-2">
                    <button onClick={handleDownload} disabled={isExporting} className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold border hover:bg-slate-200">
                        {isExporting ? 'Exportando...' : '📄 Markdown'}
                    </button>
                    <button onClick={onClose} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Volver</button>
                </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Mensaje del Mentor</p>
                <p className="text-xl italic">&quot;{review.mensaje_tutor}&quot;</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="✅ Puntos Fuertes" color="green">
                    {review.feedback.puntos_fuertes.map((p, i) => (
                        <div key={i} className="mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                            <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase">{p.categoria}</span>
                            <p className="text-sm text-green-900 mt-1">{p.descripcion}</p>
                        </div>
                    ))}
                </Section>

                <Section title="💡 Mejoras" color="blue">
                    {review.feedback.sugerencias_mejora.map((s, i) => (
                        <div key={i} className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex gap-2 mb-1">
                                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">{s.categoria}</span>
                                <span className="text-[10px] font-bold text-blue-600">{s.prioridad.toUpperCase()}</span>
                            </div>
                            <p className="text-sm text-blue-900">{s.descripcion}</p>
                        </div>
                    ))}
                </Section>
            </div>

            <div className="bg-white p-6 rounded-2xl border">
                <h3 className="font-bold mb-4">📊 Evaluación por Categorías</h3>
                <div className="space-y-3">
                    <ScoreBar label="Claridad" score={review.calificacion_general.claridad_codigo} />
                    <ScoreBar label="Arquitectura" score={review.calificacion_general.arquitectura} />
                    <ScoreBar label="Testing" score={review.calificacion_general.testing} />
                    <ScoreBar label="Docs" score={review.calificacion_general.documentacion} />
                    <div className="pt-4 flex justify-between items-center border-t">
                        <span className="font-black text-xl">TOTAL</span>
                        <span className="text-3xl font-black text-indigo-600">{review.calificacion_general.total} <span className="text-sm text-gray-400">/ 5</span></span>
                    </div>
                </div>
            </div>

            <LessonFeedback lessonId={review.review_id} />
        </div>
    );
}

function Section({ title, color, children }: { title: string, color: string, children: React.ReactNode }) {
    return (
        <div className={`bg-white rounded-2xl border p-6 shadow-sm`}>
            <h3 className={`text-lg font-bold mb-4 border-b pb-2`}>{title}</h3>
            {children}
        </div>
    );
}

function ScoreBar({ label, score }: { label: string, score: number }) {
    return (
        <div className="flex items-center gap-4">
            <span className="w-24 text-sm font-bold text-gray-600">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(score / 5) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-indigo-600">{score}</span>
        </div>
    );
}
