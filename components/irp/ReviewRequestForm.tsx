'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import { ReviewRequestData } from '../../types/irp';

interface ReviewRequestFormProps {
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
}

export default function ReviewRequestForm({ onSuccess, onError }: ReviewRequestFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        project_name: '',
        github_repo_url: '',
        pull_request_url: '',
        code_content: '',
        phase: 1,
        week: 1,
        description: '',
        learning_objectives: '',
        specific_focus: '',
    });

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.project_name.trim()) newErrors.project_name = 'Requerido';
        if (!formData.description.trim()) newErrors.description = 'Requerido';
        if (!formData.code_content.trim() && !formData.github_repo_url.trim()) newErrors.code_content = 'Pega código o pon repo URL';
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const valErrors = validate();
        if (Object.keys(valErrors).length > 0) {
            setErrors(valErrors);
            return;
        }

        setLoading(true);
        try {
            const payload: ReviewRequestData = {
                ...formData,
                learning_objectives: formData.learning_objectives.split(',').map(s => s.trim()).filter(Boolean),
                specific_focus: formData.specific_focus.split(',').map(s => s.trim()).filter(Boolean),
                github_repo_url: formData.github_repo_url || null,
                pull_request_url: formData.pull_request_url || null,
                code_content: formData.code_content || null,
            };

            const res = await fetch('/api/v1/irp/reviews/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error creating request');
            onSuccess?.(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            onError?.(err);
            setErrors({ _form: message });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border">
            <h3 className="text-xl font-bold flex gap-2 items-center">🚀 Nueva Solicitud</h3>

            {errors._form && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{errors._form}</div>}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold mb-1">Nombre Proyecto *</label>
                    <input name="project_name" value={formData.project_name} onChange={handleChange} className="w-full border rounded p-2" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Código Fuente *</label>
                    <textarea name="code_content" value={formData.code_content} onChange={handleChange} rows={6} className="w-full border rounded p-2 font-mono text-xs" placeholder="Pega tu código aquí..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Fase</label>
                        <select name="phase" value={formData.phase} onChange={handleChange} className="w-full border rounded p-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(f => <option key={f} value={f}>Fase {f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Semana</label>
                        <input type="number" name="week" value={formData.week} onChange={handleChange} className="w-full border rounded p-2" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Descripción Contexto *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border rounded p-2" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Objetivos Aprendizaje (comas)</label>
                    <input name="learning_objectives" value={formData.learning_objectives} onChange={handleChange} className="w-full border rounded p-2" placeholder="Clean Code, SOLID..." />
                </div>
            </div>

            <button disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                {loading ? 'Procesando...' : '🔥 Iniciar Auditoría IA'}
            </button>
        </form>
    );
}
