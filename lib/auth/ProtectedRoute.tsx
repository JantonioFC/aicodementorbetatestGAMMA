import React, { useEffect } from 'react';
import { useAuth } from './useAuth';
import LoadingScreen from '../../components/auth/LoadingScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    showLoadingScreen?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/login',
    showLoadingScreen = true
}) => {
    const { authState, user } = useAuth();

    useEffect(() => {
        if (authState === 'unauthenticated') {
            console.log('🔒 [PROTECTED-ROUTE] Usuario no autenticado, redirigiendo a:', redirectTo);
            if (typeof window !== 'undefined') {
                window.location.href = redirectTo;
            }
        }
    }, [authState, redirectTo]);

    switch (authState) {
        case 'loading':
            console.log('⏳ [PROTECTED-ROUTE] Verificando autenticación...');
            if (showLoadingScreen) {
                return <LoadingScreen message="Verificando acceso..." />;
            }
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-white text-lg font-medium">Verificando autenticación...</p>
                    </div>
                </div>
            );

        case 'unauthenticated':
            console.log('❌ [PROTECTED-ROUTE] Acceso denegado - No autenticado');
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-orange-900">
                    <div className="text-center">
                        <div className="text-white text-6xl mb-4">🔒</div>
                        <p className="text-white text-xl font-semibold mb-2">Acceso Restringido</p>
                        <p className="text-gray-200 text-sm">Redirigiendo a inicio de sesión...</p>
                    </div>
                </div>
            );

        case 'authenticated':
            console.log('✅ [PROTECTED-ROUTE] Usuario autenticado:', user?.email);
            return <>{children}</>;

        default:
            console.error('⚠️ [PROTECTED-ROUTE] Estado de autenticación desconocido:', authState);
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center">
                        <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
                        <p className="text-white text-xl font-semibold mb-2">Error de Estado</p>
                        <p className="text-gray-400 text-sm">Por favor, recarga la página</p>
                    </div>
                </div>
            );
    }
};

export default ProtectedRoute;

export function useProtectedRoute(redirectTo = '/login') {
    const { user, authState, isAuthenticated, authLoading } = useAuth();

    useEffect(() => {
        if (authState === 'unauthenticated') {
            console.log('🔒 [USE-PROTECTED-ROUTE] Redirigiendo a:', redirectTo);
            if (typeof window !== 'undefined') {
                window.location.href = redirectTo;
            }
        }
    }, [authState, redirectTo]);

    return {
        user,
        authState,
        isAuthenticated,
        authLoading,
        isReady: authState === 'authenticated',
    };
}

interface RequireAuthProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    useLoadingScreen?: boolean;
}

export function RequireAuth({
    children,
    fallback = null,
    useLoadingScreen = true
}: RequireAuthProps) {
    const { authState, user } = useAuth();

    if (authState === 'loading') {
        if (useLoadingScreen) {
            return <LoadingScreen message="Verificando acceso..." />;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (authState === 'unauthenticated') {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                <div className="text-center">
                    <div className="text-yellow-400 text-5xl mb-4">⚠️</div>
                    <p className="text-white text-lg font-medium mb-2">Autenticación Requerida</p>
                    <p className="text-gray-400 text-sm">Necesitas iniciar sesión para acceder a esta página</p>
                </div>
            </div>
        );
    }

    console.log('✅ [REQUIRE-AUTH] Usuario autenticado:', user?.email);
    return <>{children}</>;
}

export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    options: { redirectTo?: string; showLoadingScreen?: boolean } = {}
) {
    const {
        redirectTo = '/login',
        showLoadingScreen = true,
    } = options;

    const WrappedComponent = (props: P) => {
        return (
            <ProtectedRoute redirectTo={redirectTo} showLoadingScreen={showLoadingScreen}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };

    WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}
