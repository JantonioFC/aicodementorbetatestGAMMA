import React from 'react';

interface PhaseProgressBarProps {
    faseId: number;
    tituloFase: string;
    semanasEnFase: number;
    semanasCompletadas: number;
    porcentajeCompletado: number;
}

const PhaseProgressBar: React.FC<PhaseProgressBarProps> = ({
    faseId,
    tituloFase,
    semanasEnFase,
    semanasCompletadas,
    porcentajeCompletado
}) => {

    const getProgressColor = (percentage: number) => {
        if (percentage === 0) return 'bg-gray-300';
        if (percentage < 25) return 'bg-red-400';
        if (percentage < 50) return 'bg-yellow-400';
        if (percentage < 75) return 'bg-blue-400';
        if (percentage < 100) return 'bg-green-400';
        return 'bg-green-500';
    };

    const getPhaseIcon = (percentage: number) => {
        if (percentage === 0) return '⚪';
        if (percentage < 100) return '🔄';
        return '✅';
    };

    const getTextColorClass = (percentage: number) => {
        if (percentage === 0) return 'text-gray-600';
        if (percentage < 100) return 'text-blue-600';
        return 'text-green-600';
    };

    const progressColorClass = getProgressColor(porcentajeCompletado);
    const phaseIcon = getPhaseIcon(porcentajeCompletado);
    const textColorClass = getTextColorClass(porcentajeCompletado);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    <span className="text-lg mr-2">{phaseIcon}</span>
                    <div>
                        <h4 className="font-semibold text-gray-800">
                            Fase {faseId}: {tituloFase}
                        </h4>
                        <p className="text-sm text-gray-600">
                            {semanasCompletadas} de {semanasEnFase} semanas completadas
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-bold ${textColorClass}`}>
                        {porcentajeCompletado}%
                    </span>
                </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                    className={`${progressColorClass} h-3 rounded-full transition-all duration-500 ease-out relative`}
                    style={{ width: `${Math.min(porcentajeCompletado, 100)}%` }}
                >
                    {porcentajeCompletado > 0 && porcentajeCompletado < 100 && (
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse"></div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                    {porcentajeCompletado === 0 ? 'No iniciada' :
                        porcentajeCompletado < 100 ? 'En progreso' : 'Completada'}
                </span>
                <span>
                    {semanasEnFase - semanasCompletadas} semanas restantes
                </span>
            </div>

            {porcentajeCompletado > 0 && porcentajeCompletado < 100 && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-center">
                    🎯 Fase actual en progreso
                </div>
            )}
        </div>
    );
};

export default PhaseProgressBar;
