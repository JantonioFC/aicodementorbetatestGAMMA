
import React from 'react';

interface QualityGaugeProps {
    score: number; // 0 - 100
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const QualityGauge = ({
    score,
    label = "Calidad",
    size = 'md',
    showLabel = true
}: QualityGaugeProps) => {

    // Determinar color basado en score
    const getColor = (val: number) => {
        if (val >= 90) return 'text-green-400 border-green-500/30';
        if (val >= 70) return 'text-blue-400 border-blue-500/30';
        if (val >= 50) return 'text-yellow-400 border-yellow-500/30';
        return 'text-red-400 border-red-500/30';
    };

    const colorClass = getColor(score);

    // Configuración de tamaños
    const sizes = {
        sm: { wh: 'w-16 h-16', text: 'text-xl', border: 'border-2' },
        md: { wh: 'w-24 h-24', text: 'text-3xl', border: 'border-4' },
        lg: { wh: 'w-32 h-32', text: 'text-4xl', border: 'border-[6px]' }
    };

    const s = sizes[size];

    // Calcular circunferencia para SVG dasharray
    // Radio = 45 (asumiendo viewBox 0 0 100 100)
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className={`relative ${s.wh} flex items-center justify-center`}>
                {/* SVG Ring */}
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        className="text-gray-800 stroke-current"
                        strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        className={`stroke-current transition-all duration-1000 ease-out ${colorClass.split(' ')[0]}`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Score Text */}
                <div className={`font-bold font-mono ${s.text} ${colorClass.split(' ')[0]}`}>
                    {Math.round(score)}
                </div>
            </div>

            {showLabel && (
                <div className="mt-2 text-center">
                    <span className="text-gray-400 text-sm font-medium">{label}</span>
                </div>
            )}
        </div>
    );
};

export default QualityGauge;
