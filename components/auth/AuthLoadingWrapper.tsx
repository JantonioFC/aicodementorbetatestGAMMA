/**
 * AuthLoadingWrapper - Wrapper de Carga de Autenticación
 * 
 * @description Componente cliente-only que verifica el estado de autenticación
 *              y muestra el LoadingScreen mientras la sesión está siendo validada.
 *              
 * ARQUITECTURA (FIX HYDRATION):
 * - Solo renderiza contenido DESPUÉS de montar en cliente
 * - Evita hydration mismatch al no renderizar nada diferente en servidor
 * - Usa pattern de "suppressHydrationWarning" + client-only rendering
 * 
 * @author Mentor Coder
 * @version 2.1.0 (Hydration Fix)
 * @mission 221 - Eliminación de Race Condition en Autenticación
 */
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../../lib/auth/useAuth';
import LoadingScreen from './LoadingScreen';
import { logger } from '@/lib/observability/Logger';

interface AuthLoadingWrapperProps {
  children: ReactNode;
}

export default function AuthLoadingWrapper({ children }: AuthLoadingWrapperProps) {
  const { authState, loading, user } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);

  // CRITICAL: Solo después de montar en cliente
  useEffect(() => {
    setHasMounted(true);
    logger.debug('AuthLoadingWrapper mounted on client');
  }, []);

  // HYDRATION FIX: Durante SSR y antes de montar, renderizar skeleton consistente
  // Esto evita el mismatch porque servidor y cliente inicial renderizan lo mismo
  if (!hasMounted) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900"
        suppressHydrationWarning
      />
    );
  }

  // CLIENTE: Ahora podemos usar authState de forma segura
  const isActuallyLoading = authState === 'loading' || loading;

  if (isActuallyLoading) {
    logger.debug('AuthLoadingWrapper client loading', { authState });
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // Estado resuelto - permitir renderizado de la aplicación
  logger.debug('AuthLoadingWrapper unlocked', { authState, userEmail: user?.email });
  return <>{children}</>;
}
