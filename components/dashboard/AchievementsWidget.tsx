'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/observability/Logger';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
}

interface AchievementMetadata {
    completionPercentage: number;
    totalAchievementsAvailable: number;
}

export default function AchievementsWidget() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [metadata, setMetadata] = useState<AchievementMetadata | null>(null);

    const fetchUserAchievements = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/achievements');
            const result = await response.json();
            if (result.success) {
                setAchievements(result.achievements);
                setMetadata(result.metadata);
            }
        } catch (err) {
            logger.error('Error fetching user achievements', err);
        } finally {
            setLoading(false);
        }
    };

    const checkForNewAchievements = async () => {
        try {
            setChecking(true);
            const response = await fetch('/api/v1/achievements/check', { method: 'POST' });
            const result = await response.json();
            if (result.success && result.summary.hasNewAchievements) {
                await fetchUserAchievements();
            }
        } catch (err) {
            logger.error('Error checking for new achievements', err);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        fetchUserAchievements();
    }, []);

    if (loading) return <div className="p-6 animate-pulse bg-gray-100 rounded-lg h-32"></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center">
                    🏆 Logros Obtenidos
                    {achievements.length > 0 && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 rounded-full">{achievements.length}</span>
                    )}
                </h3>
                <button
                    onClick={checkForNewAchievements}
                    disabled={checking}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                    aria-label={checking ? 'Verificando nuevos logros' : 'Verificar nuevos logros'}
                >
                    {checking ? 'Verificando...' : 'Verificar'}
                </button>
            </div>

            {metadata && (
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-blue-600 mb-1 font-bold">
                        <span>Progreso: {metadata.completionPercentage}%</span>
                        <span>{achievements.length} / {metadata.totalAchievementsAvailable}</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${metadata.completionPercentage}%` }}></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start">
                            <span className="text-3xl mr-3" role="img" aria-label={`Icono de logro: ${achievement.name}`}>{achievement.icon}</span>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{achievement.name}</h4>
                                <p className="text-xs text-gray-600">{achievement.description}</p>
                                <p className="text-[10px] text-gray-400 mt-2">{new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
