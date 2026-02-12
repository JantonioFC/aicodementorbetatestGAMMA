import React from 'react';
import LoginClient from './LoginClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Iniciar Sesión - AI Code Mentor',
    description: 'Accede a tu cuenta de AI Code Mentor - Ecosistema 360',
};

/**
 * Login Page (App Router)
 * Server Component que renderiza el cliente de la página de Login.
 */
export default function LoginPage() {
    return <LoginClient />;
}
