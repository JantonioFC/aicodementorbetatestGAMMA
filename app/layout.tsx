
import type { Metadata } from 'next';
import './globals.css';
import '../styles/design-system.css';
import { Providers } from './providers';
// @ts-ignore: Componente JS pendiente de migración
import { PixelLoader } from '../components/analytics/PixelLoader';
// @ts-ignore: Componente JS pendiente de migración
import CookieBanner from '../components/compliance/CookieBanner';

export const metadata: Metadata = {
    metadataBase: new URL('https://aicodementor.com'),
    title: {
        default: 'AI Code Mentor | Domina la Ingeniería de Software con IA',
        template: '%s | AI Code Mentor'
    },
    description: 'Plataforma de aprendizaje acelerado para desarrolladores. Transforma tu carrera con el Ecosistema 360 y mentoría basada en IA.',
    keywords: ['AI Code Mentor', 'Aprender Programación', 'Mentoría IA', 'Ingeniería de Software', 'Carrera Tech', 'Desarrollo Web', 'Full Stack'],
    authors: [{ name: 'Juan Antonio Fernández', url: 'https://github.com/Start_Juan' }],
    creator: 'AI Code Mentor Team',
    publisher: 'AI Code Mentor',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: '/',
        languages: {
            'es-ES': '/es',
            'en-US': '/en',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: 'https://aicodementor.com/',
        siteName: 'AI Code Mentor',
        title: 'AI Code Mentor | Domina la Ingeniería de Software con IA',
        description: 'Plataforma de aprendizaje acelerado para desarrolladores. Transforma tu carrera con el Ecosistema 360 y mentoría basada en IA.',
        images: [
            {
                url: '/og-image.jpg', // Relative URL is resolved by metadataBase
                width: 1200,
                height: 630,
                alt: 'AI Code Mentor Dashboard - Ecosistema 360',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@aicodementor',
        creator: '@aicodementor',
        title: 'AI Code Mentor',
        description: 'Domina la Ingeniería de Software con IA.',
        images: ['/twitter-image.jpg'],
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
};

interface RootLayoutProps {
    children: React.ReactNode;
}

/**
 * Root Layout for App Router
 * Integra SEO, Analíticas, Compliance y Proveedores Globales.
 */
export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="font-sans antialiased bg-[#0F1115] text-[#EDEDED]">
                <PixelLoader />
                <CookieBanner />
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
