'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import CurriculumBrowser from '@/components/curriculum/CurriculumBrowser';
import { CurriculumSummary } from '@/types/curriculum';

export default function ModulosClient() {
    const [curriculumData, setCurriculumData] = useState<CurriculumSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCurriculumData() {
            try {
                setLoading(true);
                const response = await fetch('/api/v1/curriculum/summary');
                if (!response.ok) throw new Error('Error al cargar currículo');
                const data = await response.json();
                setCurriculumData(data);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        fetchCurriculumData();
    }, []);

    return (
        <ProtectedRoute>
            <PrivateLayout
                title="Módulos del Sistema - AI Code Mentor"
                description="Navega por las fases y semanas de tu programa de formación"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500 font-medium">Cargando currículo...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
                        <p className="text-red-700 font-bold mb-4">❌ Error: {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : curriculumData ? (
                    <CurriculumBrowser curriculumData={curriculumData} />
                ) : null}
            </PrivateLayout>
        </ProtectedRoute>
    );
}
