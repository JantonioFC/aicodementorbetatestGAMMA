'use client';

import React from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import PrivateLayout from '../../components/layout/PrivateLayout';
import TemplateSelector from '../../components/ProjectTracking/TemplateSelector';

export default function TemplatesClient() {
    return (
        <ProtectedRoute>
            <PrivateLayout
                title="Plantillas Educativas"
                description="Centro de plantillas metodológicas Ecosistema 360"
            >
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="bg-indigo-600 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-5xl font-black mb-4">Metodología 360</h1>
                            <p className="text-indigo-100 max-w-xl text-lg italic opacity-80">
                                Documentación estructurada para potenciar tu proceso de aprendizaje y simbiosis con la IA.
                            </p>
                        </div>
                        <div className="absolute -right-10 -bottom-10 text-[200px] opacity-10 select-none">📋</div>
                    </header>

                    <TemplateSelector />
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
