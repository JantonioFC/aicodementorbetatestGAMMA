
import React from 'react';

interface TrendPoint {
    label: string;
    value: number;
}

interface TrendChartProps {
    data: TrendPoint[];
    title?: string;
    color?: string; // tailwind color name like 'purple'
    height?: number;
}

export const TrendChart = ({
    data,
    title = "Tendencia",
    color = "purple",
    height = 64
}: TrendChartProps) => {

    if (!data || data.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-lg">
                Sin datos de tendencia
            </div>
        );
    }

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = Math.min(...data.map(d => d.value), 0);
    const range = maxVal - minVal || 1;

    // SVG Polyline points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        // Invert Y because SVG 0 is top
        const normalizedY = (d.value - minVal) / range;
        const y = 100 - (normalizedY * 60 + 20); // Keep padding top/bottom
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    // Gradients IDs
    const gradId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>

                {/* Last value indicator */}
                <div className={`text-2xl font-bold text-${color}-400`}>
                    {data[data.length - 1]?.value}
                    <span className="text-sm text-gray-500 font-normal ml-1">pts</span>
                </div>
            </div>

            <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" className={`text-${color}-500`} stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" className={`text-${color}-500`} stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <polygon
                        points={areaPoints}
                        fill={`url(#${gradId})`}
                    />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                        className={`text-${color}-500 transition-all duration-1000 ease-out`}
                    />

                    {/* Data Points (Dots) */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const normalizedY = (d.value - minVal) / range;
                        const y = 100 - (normalizedY * 60 + 20);

                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4" // Radio efectivo mayor para hover (visual scaling handled by CSS/class normally, but here fixed SVGs)
                                className={`text-${color}-400 fill-[#1A1D24] stroke-current stroke-2 hover:r-6 transition-all cursor-pointer`}
                                vectorEffect="non-scaling-stroke"
                            >
                                <title>{d.label}: {d.value}</title>
                            </circle>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default TrendChart;
