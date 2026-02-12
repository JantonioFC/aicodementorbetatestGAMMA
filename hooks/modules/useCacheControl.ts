import { useState } from 'react';

interface CacheClearResponse {
    success: boolean;
    deletedCount?: number;
    error?: string;
}

export function useCacheControl() {
    const [isClearing, setIsClearing] = useState<boolean>(false);

    const clearCache = async (): Promise<boolean> => {
        setIsClearing(true);
        try {
            const response = await fetch('/api/clear-cache', { method: 'POST' });
            const data: CacheClearResponse = await response.json();

            if (data.success) {
                alert(`🧺 Cache limpiado exitosamente: ${data.deletedCount} archivos eliminados.`);
                return true;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error: any) {
            console.error('Error limpiando cache:', error);
            alert('❌ Error limpiando cache: ' + error.message);
            return false;
        } finally {
            setIsClearing(false);
        }
    };

    return { clearCache, isClearing };
}
