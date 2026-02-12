'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import PortfolioManagementSystem from '@/components/ProjectTracking/PortfolioManagementSystem';

export default function PortfolioClient() {
    return (
        <ProtectedRoute>
            <PrivateLayout title="Portfolio & Gestión - AI Code Mentor">
                <div className="space-y-8">
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Portfolio</h1>
                                <p className="text-gray-600">Exportación automática • Reset de ciclos • Gestión curricular</p>
                            </div>
                            <div className="text-4xl">🎯</div>
                        </div>
                    </div>

                    <PortfolioManagementSystem />

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3">💡 Metodología Ecosistema 360</h3>
                        <p className="text-sm text-purple-700">
                            Usa este sistema para documentar tu crecimiento profesional. Genera evidencias basadas en tu interacción con la IA y mantén un historial sólido de tus competencias.
                        </p>
                    </div>
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
