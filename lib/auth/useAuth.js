// lib/auth/useAuth.js
// LOCAL-FIRST AUTHENTICATION PROVIDER
// Reemplaza la lógica de Supabase con un usuario local automático.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@aicodementor.com',
  user_metadata: {
    full_name: 'Estudiante Demo',
    avatar_url: 'https://ui-avatars.com/api/?name=Estudiante+Demo'
  },
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: {
    provider: 'local',
    providers: ['local']
  }
};

const DEMO_SESSION = {
  access_token: 'mock-local-token',
  token_type: 'bearer',
  user: DEMO_USER,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600
};

export function AuthProvider({ children }) {
  const router = useRouter();

  // Estado siempre autenticado
  const [user, setUser] = useState(DEMO_USER);
  const [session, setSession] = useState(DEMO_SESSION);
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState('authenticated');
  const [internalToken, setInternalToken] = useState('mock-internal-token');

  // isE2EMode puede ser true, pero en local-first siempre es "mock" anyway
  const isE2EMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Funciones simplificadas
  const signIn = async () => ({ data: { user: DEMO_USER, session: DEMO_SESSION }, error: null });

  const signUp = async () => ({ data: { user: DEMO_USER, session: DEMO_SESSION }, error: null });

  const signOut = async () => {
    // Al cerrar sesión en local, simplemente recargamos o redirigimos a home
    // Pero como es "auto-login", volverá a loguear inmediatamente.
    // Simplemente navegamos a home para cumplir requisitos de UI
    await router.push('/');
    return { error: null };
  };

  const refreshSession = async () => ({ session: DEMO_SESSION, error: null });
  const getValidInternalToken = async () => 'mock-internal-token';

  const value = {
    user,
    session,
    internalToken,
    loading,
    authLoading: loading,
    authState,
    signIn,
    signUp,
    signOut,
    refreshSession,
    getValidInternalToken,
    isAuthenticated: true,
    isLoading: false,
    isUnauthenticated: false,
    userId: DEMO_USER.id,
    isE2EMode
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
