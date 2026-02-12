import React, { useState } from 'react';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

interface ResetSystemProps {
    className?: string;
}

interface ResetConfig {
    resetType: string;
    archiveData: boolean;
    resetCompetencies: boolean;
    resetPhaseProgress: boolean;
    resetModules: boolean;
    preserveSettings: boolean;
    exportBeforeReset: boolean;
    newCycleStartDate: string;
}

const ResetSystem: React.FC<ResetSystemProps> = ({ className = '' }) => {
    const {
        entryCounts,
        loading,
        refreshData
    } = useProjectTracking();

    const [resetConfig, setResetConfig] = useState<ResetConfig>({
        resetType: 'soft',
        archiveData: true,
        resetCompetencies: true,
        resetPhaseProgress: true,
        resetModules: false,
        preserveSettings: true,
        exportBeforeReset: true,
        newCycleStartDate: new Date().toISOString().split('T')[0]
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResetStart = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const response = await fetch('/api/reset-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resetConfig)
            });

            if (!response.ok) throw new Error('Reset failed');
            await refreshData();
            setCompleted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const totalEntries = Object.values(entryCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
                <h2 className="text-xl font-bold">🔄 Sistema de Reset de Ciclo</h2>
                <p className="text-orange-100 text-sm">Gestión de ciclos de 24 meses</p>
            </div>

            <div className="p-6">
                <div className="mb-6 space-y-4">
                    <label className="block text-sm font-medium">Tipo de Reset</label>
                    <div className="grid grid-cols-1 gap-2">
                        {['soft', 'hard'].map(type => (
                            <button
                                key={type}
                                onClick={() => setResetConfig({ ...resetConfig, resetType: type })}
                                className={`p-3 text-left border rounded-lg ${resetConfig.resetType === type ? 'border-orange-500 bg-orange-50' : ''}`}
                            >
                                <span className="font-bold">{type === 'soft' ? '🗂️ Suave (Archivar)' : '❗ Completo (Borrar)'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {completed ? (
                    <div className="bg-green-50 p-4 rounded text-center">
                        <p className="text-green-700 font-bold">¡Ciclo reiniciado!</p>
                        <button onClick={() => setCompleted(false)} className="text-blue-600 text-sm underline mt-2">Cerrar</button>
                    </div>
                ) : (
                    <button
                        onClick={handleResetStart}
                        disabled={isProcessing || totalEntries === 0}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                    >
                        {isProcessing ? 'Procesando...' : '🔄 Ejecutar Reset'}
                    </button>
                )}

                {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default ResetSystem;
