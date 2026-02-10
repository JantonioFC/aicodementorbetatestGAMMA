import React, { useState } from 'react';
import PortfolioExportSystem from './PortfolioExportSystem';
import ResetSystem from './ResetSystem';
import { useProjectTracking } from '../../contexts/ProjectTrackingContext';

interface PortfolioManagementSystemProps {
    className?: string;
}

const PortfolioManagementSystem: React.FC<PortfolioManagementSystemProps> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'portfolio' | 'reset'>('portfolio');
    const { entryCounts } = useProjectTracking();

    const getTotalEntries = () => Object.values(entryCounts).reduce((sum, count) => sum + count, 0);
    const totalEntries = getTotalEntries();

    const tabs = [
        { id: 'portfolio', name: 'Export Portfolio', icon: '📄', description: 'Generar portfolio profesional' },
        { id: 'reset', name: 'Gestión de Ciclos', icon: '🔄', description: 'Reset y nuevo ciclo', badge: 'AVANZADO' }
    ] as const;

    return (
        <div className={className}>
            <div className="mb-6 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">📊 Portfolio y Ciclos - Ecosistema 360</h1>
                        <p className="text-gray-600">Sistema avanzado de gestión de evidencias y progresión curricular.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{totalEntries}</div>
                        <div className="text-sm text-blue-800">Evidencias</div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <nav className="flex space-x-1 bg-white p-1 rounded-lg border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'portfolio' | 'reset')}
                            className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xl mr-3">{tab.icon}</span>
                            <div className="text-left">
                                <div className="font-medium">{tab.name}</div>
                                <div className="text-xs opacity-80">{tab.description}</div>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'portfolio' ? <PortfolioExportSystem /> : <ResetSystem />}
            </div>
        </div>
    );
};

export default PortfolioManagementSystem;
