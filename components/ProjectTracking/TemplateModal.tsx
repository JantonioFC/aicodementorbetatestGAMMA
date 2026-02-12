import React, { useState, useEffect } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';
import SimpleInput from '../ui/atoms/SimpleInput';
import { logger } from '@/lib/observability/Logger';

interface TemplateDefinition {
    name: string;
    icon: string;
    subtitle?: string;
    description: string;
    template: string;
    metadata_fields?: Record<string, string>;
}

type MetadataValue = string | number | boolean | string[];

const TemplateModal: React.FC = () => {
    const {
        selectedTemplate,
        templates,
        isModalOpen,
        closeModal,
        createEntry,
        resetError,
        error
    } = useProjectTracking();

    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState<Record<string, MetadataValue>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getWeekNumber = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + start.getDay() + 1) / 7);
    };

    useEffect(() => {
        if (selectedTemplate && templates[selectedTemplate]) {
            const template = templates[selectedTemplate] as TemplateDefinition;

            const today = new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let templateContent = template.template;
            templateContent = templateContent.replace(/{date}/g, today);
            templateContent = templateContent.replace(/{week_number}/g, getWeekNumber().toString());

            setContent(templateContent);

            if (template.metadata_fields) {
                const initialMetadata: Record<string, MetadataValue> = {};
                Object.entries(template.metadata_fields).forEach(([field, fieldType]) => {
                    if (fieldType === 'number') {
                        initialMetadata[field] = 0;
                    } else if (fieldType === 'boolean') {
                        initialMetadata[field] = false;
                    } else if (fieldType === 'array') {
                        initialMetadata[field] = [];
                    } else {
                        initialMetadata[field] = '';
                    }
                });
                setMetadata(initialMetadata);
            } else {
                setMetadata({});
            }
        }
    }, [selectedTemplate, templates]);

    useEffect(() => {
        if (!isModalOpen) {
            setContent('');
            setMetadata({});
            setIsSubmitting(false);
        } else {
            resetError();
        }
    }, [isModalOpen, resetError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !selectedTemplate) return;

        setIsSubmitting(true);
        try {
            await createEntry(selectedTemplate, content, metadata);
            closeModal();
        } catch (error) {
            logger.error('Error creating entry', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMetadataChange = (field: string, value: string) => {
        if (!selectedTemplate) return;
        const template = templates[selectedTemplate] as TemplateDefinition | undefined;
        const fieldType = template?.metadata_fields?.[field];

        let processedValue: MetadataValue = value;
        if (fieldType === 'array') {
            processedValue = value.trim() ? [value.trim()] : [];
        } else if (fieldType === 'number') {
            processedValue = parseInt(value) || 0;
        } else if (fieldType === 'boolean') {
            processedValue = Boolean(value);
        }

        setMetadata(prev => ({ ...prev, [field]: processedValue }));
    };

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            'estado_animo': 'Estado de Ánimo',
            'horas_estudiadas': 'Horas Estudiadas',
            'nivel_concentracion': 'Nivel de Concentración (1-10)',
            'nivel_confianza': 'Nivel de Confianza (1-10)',
            'week_number': 'Número de Semana',
            'goals_completed': 'Objetivos Completados',
            'goals_total': 'Total de Objetivos',
            'satisfaction': 'Satisfacción (1-10)',
        };
        return labels[field] || field.replace(/_/g, ' ');
    };

    if (!isModalOpen || !selectedTemplate) return null;
    const template = templates[selectedTemplate] as TemplateDefinition | undefined;
    if (!template) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">{template.icon}</span>
                            <div>
                                <h2 className="text-xl font-bold">{template.name}</h2>
                                {template.subtitle && <p className="text-blue-100 text-xs font-medium mb-1">{template.subtitle}</p>}
                                <p className="text-blue-100 text-sm">{template.description}</p>
                            </div>
                        </div>
                        <button onClick={closeModal} className="text-white hover:text-gray-300 appearance-none bg-transparent border-none cursor-pointer">✕</button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800">🎓 Metodología Ecosistema 360</h4>
                            <p className="text-xs text-blue-600">Simbiosis Crítica Humano-IA activa.</p>
                        </div>

                        {template.metadata_fields && (
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(template.metadata_fields).map(([field, type]) => (
                                    <SimpleInput
                                        key={field}
                                        type={type as string}
                                        value={typeof metadata[field] === 'boolean' ? String(metadata[field]) : metadata[field]}
                                        onChange={(e) => handleMetadataChange(field, e.target.value)}
                                        label={getFieldLabel(field)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Contenido</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-4 min-h-[300px] border border-gray-300 rounded-lg font-mono text-sm"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md">
                                {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
