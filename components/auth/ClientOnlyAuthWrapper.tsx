'use client';

import { useAuth } from '../../lib/auth/useAuth';
import LoadingScreen from './LoadingScreen';
import { useEffect, ReactNode } from 'react';
import { logger } from '@/lib/observability/Logger';

/**
 * ClientOnlyAuthWrapper
 * 
 * @description Wrapper de autenticación que se renderiza SOLO en cliente
 *              para evitar hydration mismatch. Se importa con dynamic import
 *              y { ssr: false } desde _app.js.
 * 
 * @architecture
 * - NO se renderiza en servidor (ssr: false en dynamic import)
 * - Muestra LoadingScreen mientras authState es 'loading'
 * - Renderiza children cuando autenticación está resuelta
 * 
 * @author AI Code Mentor Team
 * @date 2026-02-06
 */

interface ClientOnlyAuthWrapperProps {
    children: ReactNode;
}

export default function ClientOnlyAuthWrapper({ children }: ClientOnlyAuthWrapperProps) {
    const authContext = useAuth();
    const { authState, loading, user } = authContext;

    // DEBUG: Log every render
    logger.debug('AuthWrapper render', { authState, loading, userEmail: user?.email });

    // DEBUG: Track state changes
    useEffect(() => {
        logger.debug('AuthWrapper state changed', { authState, loading });
    }, [authState, loading]);

    // Mientras auth está cargando, mostrar loading screen
    if (authState === 'loading' || loading) {
        logger.debug('AuthWrapper showing LoadingScreen');
        return <LoadingScreen message="Verificando sesión..." />;
    }

    // Auth resuelto - renderizar app
    logger.debug('AuthWrapper rendering children');
    return <>{children}</>;
}
