import { ReactElement } from 'react';
import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
    title: 'Aprende Ingeniería de Software con IA',
    description: 'Plataforma de aprendizaje acelerado de ingeniería de software con mentoría basada en IA y el Ecosistema 360.',
};

/**
 * Landing Page (App Router)
 * Server Component que renderiza el cliente de la Landing Page.
 */
export default function Page(): ReactElement {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                'name': 'AI Code Mentor',
                'url': 'https://aicodementor.com',
                'description': 'Plataforma de aprendizaje acelerado de ingeniería de software con IA.',
                'potentialAction': {
                    '@type': 'SearchAction',
                    'target': 'https://aicodementor.com/search?q={search_term_string}',
                    'query-input': 'required name=search_term_string'
                }
            },
            {
                '@type': 'SoftwareApplication',
                'name': 'AI Code Mentor',
                'applicationCategory': 'EducationalApplication',
                'operatingSystem': 'Web',
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD'
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingClient />
        </>
    );
}
