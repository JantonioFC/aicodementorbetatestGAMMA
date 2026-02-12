import { Metadata } from 'next';
import CommunityClient from './CommunityClient';

export const metadata: Metadata = {
    title: 'Comunidad',
    description: 'Conecta con otros desarrolladores y comparte tu progreso.',
};

export default function CommunityPage() {
    return <CommunityClient />;
}
