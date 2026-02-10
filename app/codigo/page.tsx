'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import SandboxWidget from '@/components/Sandbox/SandboxWidget';

export default function CodigoPage() {
    return (
        <ProtectedRoute>
            <PrivateLayout
                title="Sandbox de Aprendizaje - AI Code Mentor"
                description="Generación de lecciones interactivas con IA avanzada"
            >
                <div className="space-y-8">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-50 via-teal-50 to-emerald-50 rounded-lg p-6 border border-cyan-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 Sandbox de Aprendizaje</h1>
                                <p className="text-gray-600">Transforma contenido en lecciones • Análisis IA • Ejercicios interactivos</p>
                            </div>
                            <div className="text-4xl">🤖</div>
                        </div>
                    </div>

                    <SandboxWidget />
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
