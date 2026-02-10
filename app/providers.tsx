
'use client';

// @ts-ignore: Contextos pendientes de migración
import { AuthProvider, useAuth } from '../lib/auth/useAuth';
// @ts-ignore: Contextos pendientes de migración
import { APITrackingProvider } from '../contexts/APITrackingContext';
// @ts-ignore: Contextos pendientes de migración
import { LessonProvider } from '../contexts/LessonContext';
// @ts-ignore: Contextos pendientes de migración
import { ProjectTrackingProvider } from '../contexts/ProjectTrackingContext';
// @ts-ignore: Componente JS pendiente de migración
import LoadingScreen from '../components/auth/LoadingScreen';

interface ProvidersProps {
    children: React.ReactNode;
}

/**
 * AuthGate Component (App Router version)
 * Maneja el estado de carga inicial de la sesión.
 */
function AuthGate({ children }: ProvidersProps) {
    const { authState, loading }: { authState: string, loading: boolean } = useAuth();

    console.log('🚪 [APP-AUTH-GATE] Render - authState:', authState, 'loading:', loading);

    if (authState === 'loading' || loading) {
        return <LoadingScreen message="Sincronizando con el Mentor IA..." />;
    }

    return <>{children}</>;
}

/**
 * Global Providers for App Router
 * Envuelve los componentes hijo con todos los contextos necesarios.
 */
export function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <AuthGate>
                <APITrackingProvider>
                    <LessonProvider>
                        <ProjectTrackingProvider>
                            {children}
                        </ProjectTrackingProvider>
                    </LessonProvider>
                </APITrackingProvider>
            </AuthGate>
        </AuthProvider>
    );
}
