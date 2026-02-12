/**
 * Componente: PeriodSelector
 * 
 * Selector de período para filtrar métricas por tiempo.
 * 
 * @author Mentor Coder
 * @version 1.0.0
 * @created 2025-10-05
 * @mission 204.0 - Dashboard de Métricas IRP
 */

import React from 'react';

const PERIODS = [
  { value: 'week', label: 'Última Semana', icon: '📅' },
  { value: 'month', label: 'Último Mes', icon: '📆' },
  { value: 'quarter', label: 'Último Trimestre', icon: '📊' },
  { value: 'year', label: 'Último Año', icon: '📈' },
  { value: 'all', label: 'Todo el Tiempo', icon: '⏳' }
] as const;

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  lastUpdated?: Date | null;
}

export default function PeriodSelector({ value, onChange, lastUpdated }: PeriodSelectorProps) {

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4" role="toolbar" aria-label="Selector de período de métricas">
      <div className="flex items-center gap-3">
        <label htmlFor="period-selector" className="text-sm font-medium text-gray-700">
          Período:
        </label>
        <select
          id="period-selector"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
          aria-label="Seleccionar período de tiempo"
        >
          {PERIODS.map(period => (
            <option key={period.value} value={period.value}>
              {period.icon} {period.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600" aria-live="polite">
        {lastUpdated && (
          <>
            <span>Última actualización:</span>
            <span className="font-medium">
              {lastUpdated.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
