
import React from 'react';

interface TimelineEvent {
    id: string | number;
    title: string;
    date: string; // ISO String or formatted date
    status: 'completed' | 'current' | 'upcoming';
    description?: string;
}

interface TimelineChartProps {
    events: TimelineEvent[];
    title?: string;
}

export const TimelineChart = ({ events, title = "Línea de Tiempo" }: TimelineChartProps) => {
    return (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-6">{title}</h3>

            <div className="relative border-l-2 border-gray-800 ml-3 space-y-8">
                {events.map((event, index) => (
                    <div key={event.id} className="relative pl-8">
                        {/* Dot Indicator */}
                        <div
                            className={`
                                absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 
                                transition-all duration-300
                                ${event.status === 'completed' ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : ''}
                                ${event.status === 'current' ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-500/20' : ''}
                                ${event.status === 'upcoming' ? 'bg-[#1A1D24] border-gray-600' : ''}
                            `}
                        />

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                            <h4 className={`text-base font-medium ${event.status === 'upcoming' ? 'text-gray-400' : 'text-gray-200'
                                }`}>
                                {event.title}
                            </h4>
                            <span className="text-xs text-gray-500 font-mono">
                                {event.date}
                            </span>
                        </div>

                        {event.description && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                {event.description}
                            </p>
                        )}

                        {event.status === 'current' && (
                            <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800/50 animate-pulse">
                                En Progreso
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineChart;
