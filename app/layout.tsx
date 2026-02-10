
import type { Metadata } from 'next';
import './globals.css';
import '../styles/design-system.css';
import { Providers } from './providers';
// @ts-ignore: Componente JS pendiente de migración
import { PixelLoader } from '../components/analytics/PixelLoader';
// @ts-ignore: Componente JS pendiente de migración
import CookieBanner from '../components/compliance/CookieBanner';

export const metadata: Metadata = {
    title: 'AI Code Mentor | Domina la Ingeniería de Software con IA',
    description: 'Plataforma de aprendizaje acelerado para desarrolladores. Transforma tu carrera con el Ecosistema 360 y mentoría basada en IA.',
    openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: 'https://aicodementor.com/',
        siteName: 'AI Code Mentor',
        images: [
            {
                url: 'https://aicodementor.com/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'AI Code Mentor Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image', // Corrected type for Twitter card
        site: '@aicodementor',
        creator: '@aicodementor', // Added creator as it's common
    },
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
