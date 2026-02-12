'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PrivateLayout from '@/components/layout/PrivateLayout';
import { getTemplate } from '@/lib/templates';
import { Template, GenerationResult } from '@/types/templates';

export default function CrearPlantillaClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams?.get('type');

    const [template, setTemplate] = useState<Template | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (type) {
            const data = getTemplate(type);
            if (data) {
                setTemplate(data);
                const placeholders = Array.from(data.template.matchAll(/\{([^}]+)\}/g)).map(m => m[1]);
                const initial: Record<string, string> = {};
                placeholders.forEach(p => initial[p] = '');
                initial.date = new Date().toISOString().split('T')[0];
                setFormData(initial);
            } else {
                router.push('/plantillas');
            }
        }
    }, [type, router]);

    const handleGenerate = () => {
        if (!template) return;
        setLoading(true);
        let content = template.template;
        Object.entries(formData).forEach(([k, v]) => {
            content = content.replaceAll(`{${k}}`, v || `[${k}]`);
        });

        setResult({
            content,
            metadata: {
                generatedAt: new Date().toISOString(),
                templateType: type || 'custom',
                templateName: template.name,
                placeholdersUsed: Object.keys(formData).length
            },
            filename: `${type}_${new Date().toISOString().split('T')[0]}.md`
        });
        setLoading(false);
    };

    if (!template) return <div className="p-20 text-center animate-pulse">Cargando editor...</div>;

    return (
        <ProtectedRoute>
            <PrivateLayout title={result ? 'Plantilla Generada' : `Crear ${template.name}`}>
                <div className="max-w-4xl mx-auto space-y-8">
                    {result ? (
                        <div className="bg-white p-8 rounded-2xl border shadow-xl animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black">✨ Resultado Generado</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setResult(null)} className="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold font-mono">EDITAR</button>
                                    <button onClick={() => router.push('/plantillas')} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold">LISTA</button>
                                </div>
                            </div>
                            <div className="bg-[#0a0a0c] p-8 rounded-xl font-mono text-sm text-emerald-400 overflow-auto max-h-[500px] border border-white/5">
                                {result.content}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-3xl border shadow-sm">
                            <div className="mb-10 text-center">
                                <span className="text-4xl mb-4 block">{template.icon}</span>
                                <h1 className="text-4xl font-black text-gray-900">{template.name}</h1>
                                <p className="text-gray-500 mt-2">{template.subtitle}</p>
                            </div>

                            <div className="space-y-6">
                                {Object.keys(formData).map(k => (
                                    <div key={k}>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{k.replace('_', ' ')}</label>
                                        <input
                                            type={k.includes('date') ? 'date' : 'text'}
                                            value={formData[k]}
                                            onChange={e => setFormData({ ...formData, [k]: e.target.value })}
                                            className="w-full border-2 border-gray-100 focus:border-indigo-600 rounded-xl px-5 py-4 transition-all focus:outline-none placeholder:text-gray-200"
                                            placeholder={`Escribe ${k}...`}
                                        />
                                    </div>
                                ))}

                                <button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl text-lg hover:bg-black transition-all transform active:scale-95 shadow-xl shadow-indigo-100">
                                    {loading ? 'GENERANDO PROTOCOLO...' : 'GENERAR PLANTILLA'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PrivateLayout>
        </ProtectedRoute>
    );
}
