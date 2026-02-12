
// lib/auth/useAuth.tsx
// LOCAL-FIRST AUTHENTICATION PROVIDER (Real Implementation)
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '../observability/Logger';

// Tipos básicos para el usuario y la sesión
export interface User {
    id: string;
    email: string;
    role?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: unknown;
    };
    app_metadata?: {
        provider?: string;
        [key: string]: unknown;
    };
}

export interface AuthSession {
    user: User;
    access_token?: string;
}

interface AuthResponse {
    data?: Record<string, unknown>;
    user?: User;
    session?: AuthSession;
    error?: string | null;
}

interface AuthContextType {
    user: User | null;
    session: AuthSession | null;
    loading: boolean;
    authLoading: boolean;
    authState: 'loading' | 'authenticated' | 'unauthenticated';
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>;
    signOut: () => Promise<{ error: null }>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

    // --- Functions (Defined with callback to maintain stable references) ---

    const refreshSession = useCallback(async (): Promise<boolean> => {
        try {
            // Refreshing...
            const res = await fetch('/api/auth/refresh', { method: 'POST' });

            if (res.ok) {
                // Session refreshed
                return true;
            }
            return false;
        } catch (error: unknown) {
            console.error('Error refreshing session:', error);
            return false;
        }
    }, []);

    const checkSession = useCallback(async (): Promise<void> => {
        try {
            // Checking...
            setLoading(true);

            const res = await fetch(`/api/auth/user?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });

            if (res.ok) {
                const data = await res.json() as { user: User };
                setUser(data.user);
                setAuthState('authenticated');
            } else {
                // Si falla el check inicial, intentamos refrescar antes de dar por muerta la sesión
                const refreshed = await refreshSession();
                if (!refreshed) {
                    setUser(null);
                    setAuthState('unauthenticated');
                }
            }
        } catch (error: unknown) {
            console.error('❌ [USE-AUTH] Session check error:', error);
            setUser(null);
            setAuthState('unauthenticated');
        } finally {
            setLoading(false);
        }
    }, [refreshSession]);

    // Verificación inicial de sesión y setup de auto-refresh
    useEffect(() => {
        checkSession();

        // Auto-refresh cada 10 minutos (AccessToken dura 15m)
        const refreshInterval = setInterval(() => {
            if (authState === 'authenticated') {
                refreshSession();
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [authState, checkSession, refreshSession]);

    const signIn = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json() as { user: User; error?: string };

            if (!res.ok) {
                return { error: data.error || 'Error al iniciar sesión' };
            }

            setUser(data.user);
            setAuthState('authenticated');
            return { data: data as unknown as Record<string, unknown>, user: data.user, error: null };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string, metadata: Record<string, unknown> = {}): Promise<AuthResponse> => {
        try {
            setLoading(true);
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    display_name: metadata.display_name
                })
            });

            const data = await res.json() as { user: User; error?: string };

            if (!res.ok) {
                return { error: data.error || 'Error al registrarse' };
            }

            setUser(data.user);
            setAuthState('authenticated');
            return { data: data as unknown as Record<string, unknown>, user: data.user, error: null };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { error: message };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (): Promise<{ error: null }> => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error: unknown) {
            logger.error('Error signing out', error);
        } finally {
            setUser(null);
            setAuthState('unauthenticated');
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
        return { error: null };
    };

    const value: AuthContextType = {
        user,
        session: user ? { user } : null,
        loading,
        authLoading: loading,
        authState,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        checkSession
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}

export default useAuth;
