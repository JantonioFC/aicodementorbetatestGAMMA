import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@aicodementor.com',
  user_metadata: {
    full_name: 'Estudiante Demo',
    avatar_url: 'https://ui-avatars.com/api/?name=Estudiante+Demo'
  },
  role: 'authenticated',
  aud: 'authenticated'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const [loading, setLoading] = useState(false); // Always ready

  const value = {
    user,
    loading,
    session: {
      user: DEMO_USER,
      access_token: 'mock-local-token'
    },
    signInWithGoogle: async () => { }, // No-op
    signOut: async () => {
      // In local mode, sign out just reloads or ignores
      window.location.reload();
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
