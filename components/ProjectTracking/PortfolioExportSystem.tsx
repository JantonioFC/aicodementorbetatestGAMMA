import React, { useState } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

interface PortfolioExportSystemProps {
    className?: string;
}

interface ExportConfig {
    includeTemplates: boolean;
    includeModules: boolean;
    includeAnalytics: boolean;
    format: string;
    theme: string;
    competencyLevel: string;
    studentName: string;
}

interface ExportStatus {
    isExporting: boolean;
    progress: number;
    currentStep: string;
    completed: boolean;
    downloadUrl: string | null;
    error: string | null;
    metadata: any | null;
}

const PortfolioExportSystem: React.FC<PortfolioExportSystemProps> = ({ className = '' }) => {
    const {
        entryCounts,
        loading
    } = useProjectTracking();

    const [exportConfig, setExportConfig] = useState<ExportConfig>({
        includeTemplates: true,
        includeModules: true,
        includeAnalytics: true,
        format: 'pdf',
        theme: 'ecosistema360',
        competencyLevel: 'auto',
        studentName: 'AI Code Mentor User'
    });

    const [exportStatus, setExportStatus] = useState<ExportStatus>({
        isExporting: false,
        progress: 0,
        currentStep: '',
        completed: false,
        downloadUrl: null,
        error: null,
        metadata: null
    });

    const portfolioStructure = {
        sections: [
            { id: 'executive_summary', title: '📋 Resumen Ejecutivo', description: 'Progreso general' },
            { id: 'competency_framework', title: '🏆 Marco de Competencias (HRC)', description: 'Progresión skill development' },
            { id: 'evidence_documentation', title: '📄 Documentación de Evidencias', description: 'DDE • PAS • HRC • IRP' },
            { id: 'learning_modules', title: '📚 Módulos de Aprendizaje', description: 'Lecciones completadas' },
            { id: 'analytics_insights', title: '📊 Métricas y Análisis', description: 'Progress tracking' },
            { id: 'future_development', title: '🚀 Plan de Desarrollo Futuro', description: 'Roadmap de competencias' }
        ]
    };

    const handleExportStart = async () => {
        setExportStatus({
            isExporting: true, progress: 0, currentStep: 'Inicializando...', completed: false, downloadUrl: null, error: null, metadata: null
        });

        try {
            setExportStatus(prev => ({ ...prev, progress: 10, currentStep: 'Preparando datos...' }));
            setExportStatus(prev => ({ ...prev, progress: 30, currentStep: `Generando ${exportConfig.format.toUpperCase()}...` }));

            const response = await fetch('/api/export-portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format: exportConfig.format,
                    config: exportConfig
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }

            const result = await response.json();
            setExportStatus(prev => ({ ...prev, progress: 80, currentStep: 'Finalizando...' }));
            await new Promise(resolve => setTimeout(resolve, 500));

            setExportStatus({
                isExporting: false, progress: 100, currentStep: 'Completado', completed: true, downloadUrl: result.downloadUrl, error: null, metadata: result.metadata
            });
        } catch (error: any) {
            setExportStatus({
                isExporting: false, progress: 0, currentStep: '', completed: false, downloadUrl: null, error: error.message, metadata: null
            });
        }
    };

    const handleDownload = () => {
        if (exportStatus.downloadUrl) {
            const link = document.createElement('a');
            link.href = exportStatus.downloadUrl;
            link.download = `portfolio-${exportConfig.format}-${Date.now()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getTotalEntries = () => Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
    const totalEntries = getTotalEntries();

    const getCurrentCompetencyLevel = () => {
        if (totalEntries >= 15) return { level: 4, name: 'Avanzado', icon: '🏆' };
        if (totalEntries >= 10) return { level: 3, name: 'Intermedio', icon: '🌳' };
        if (totalEntries >= 5) return { level: 2, name: 'Básico', icon: '🌿' };
        return { level: 1, name: 'Principiante', icon: '🌱' };
    };

    const competencyLevel = getCurrentCompetencyLevel();

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
            <div className="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 text-white p-6">
                <h2 className="text-xl font-bold flex items-center">📄 Exportación de Portfolio</h2>
                <p className="text-emerald-100 text-sm">Ecosistema 360 • Evidencias Documentadas</p>
            </div>

            <div className="p-6">
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded border">
                        <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
                        <div className="text-xs text-gray-500">Evidencias</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded border">
                        <div className="text-2xl font-bold text-purple-600">{competencyLevel.level}</div>
                        <div className="text-xs text-gray-500">{competencyLevel.name}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Formato</label>
                        <select
                            value={exportConfig.format}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="pdf">📄 PDF Profesional</option>
                            <option value="html">🌐 Página Web</option>
                            <option value="github">🐙 GitHub Pages</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tu nombre</label>
                        <input
                            type="text"
                            value={exportConfig.studentName}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, studentName: e.target.value }))}
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Nombre para el portfolio"
                        />
                    </div>
                </div>

                {exportStatus.completed && (
                    <div className="bg-green-50 p-4 rounded text-center mb-6">
                        <p className="text-green-700 font-bold mb-2">¡Exportación Exitosa!</p>
                        <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded text-sm mb-2">Descargar</button>
                        <button onClick={() => setExportStatus({ ...exportStatus, completed: false })} className="block mx-auto text-xs text-gray-500">Volver</button>
                    </div>
                )}

                {!exportStatus.isExporting && !exportStatus.completed && (
                    <button
                        onClick={handleExportStart}
                        disabled={totalEntries === 0 || loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : `Exportar Portfolio (${totalEntries} evidencias)`}
                    </button>
                )}

                {exportStatus.isExporting && (
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">{exportStatus.currentStep}</p>
                    </div>
                )}

                {exportStatus.error && <p className="text-red-600 text-sm mt-4 text-center">{exportStatus.error}</p>}
            </div>
        </div>
    );
};

export default PortfolioExportSystem;
