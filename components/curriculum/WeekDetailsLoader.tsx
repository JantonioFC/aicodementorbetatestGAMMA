'use client';

/**
 * WEEK DETAILS LOADER - TypeScript Migration
 */

import WeekDetails, { WeekDetailsProps } from './WeekDetails';
import GuiaEstudio from './GuiaEstudio';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface WeekDetailsLoaderProps {
    activeWeek: { semana: number; tituloSemana: string };
    weekDetailsData: Record<string, unknown> | null;
    loadingWeekDetails: boolean;
    weekDetailsError: { message: string; details?: string } | null;
    onRetry: () => void;
}

export default function WeekDetailsLoader({
    activeWeek,
    weekDetailsData,
    loadingWeekDetails,
    weekDetailsError,
    onRetry
}: WeekDetailsLoaderProps) {
    if (loadingWeekDetails) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center animate-pulse">
                <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cargando detalles...</h3>
                <p className="text-gray-500 text-sm">Semana {activeWeek.semana}</p>
            </div>
        );
    }

    if (weekDetailsError) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-12 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Error de carga</h3>
                <p className="text-red-600 text-sm mb-6">{weekDetailsError.message}</p>
                <button onClick={onRetry} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700">Reintentar</button>
            </div>
        );
    }

    if (weekDetailsData) {
        const guiaEstudio = weekDetailsData.guiaEstudio as Record<string, unknown> | undefined;
        const hasGuiaEstudio = !!(guiaEstudio && Object.keys(guiaEstudio).length > 0);

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-green-50 px-6 py-3 border-b flex justify-between items-center">
                    <span className="text-green-800 text-sm font-bold flex gap-2 items-center">
                        {hasGuiaEstudio ? '🎯 Guía Estratégica Cargada' : '📊 Datos Completos (SQLite)'}
                        {hasGuiaEstudio && <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px]">PROYECTO</span>}
                    </span>
                    <span className="text-[10px] text-green-600">Semana {activeWeek.semana}</span>
                </div>

                {hasGuiaEstudio
                    ? <GuiaEstudio weekData={weekDetailsData as Parameters<typeof GuiaEstudio>[0]['weekData']} />
                    : <WeekDetails weekData={weekDetailsData as WeekDetailsProps['weekData']} />}
            </div>
        );
    }

    return null;
}
