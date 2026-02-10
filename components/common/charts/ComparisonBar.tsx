
import React from 'react';

interface ComparisonBarProps {
    label: string;
    value: number; // 0-100
    avgValue?: number; // 0-100 (Benchmark)
    color?: string; // Tailwind color class (e.g. 'blue', 'green')
    showBenchmark?: boolean;
}

export const ComparisonBar = ({
    label,
    value,
    avgValue = 50,
    color = 'blue',
    showBenchmark = true
}: ComparisonBarProps) => {

    // Calcular porcentajes seguros
    const safeValue = Math.min(100, Math.max(0, value));
    const safeAvg = Math.min(100, Math.max(0, avgValue));

    // Colores dinámicos
    const barColor = `bg-${color}-500`;
    const bgColor = `bg-${color}-900/20`;

    return (
        <div className="mb-4 group">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                    {label}
                </span>
                <span className="text-gray-300 font-mono">
                    {safeValue}% <span className="text-gray-600 text-[10px] ml-1">/ 100%</span>
                </span>
            </div>

            <div className="relative h-2.5 bg-[#0F1115] rounded-full overflow-hidden border border-gray-800">
                {/* Background Track */}
                <div className={`absolute inset-0 ${bgColor} opacity-50`} />

                {/* Benchmark Marker (Promedio) */}
                {showBenchmark && (
                    <div
                        className="absolute h-full w-0.5 bg-gray-500/50 z-10"
                        style={{ left: `${safeAvg}%` }}
                        title={`Promedio: ${safeAvg}%`}
                    />
                )}

                {/* Main Value Bar */}
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                    style={{ width: `${safeValue}%` }}
                />
            </div>

            {/* Benchmark Label */}
            {showBenchmark && (
                <div className="relative h-4 mt-0.5">
                    <div
                        className="absolute text-[9px] text-gray-600 transform -translate-x-1/2"
                        style={{ left: `${safeAvg}%` }}
                    >
                        ▲ Avg
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonBar;
