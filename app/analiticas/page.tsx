import { Metadata } from 'next';
import AnaliticasClient from './AnaliticasClient';

export const metadata: Metadata = {
    title: 'Analíticas',
    description: 'Estadísticas detalladas de tu progreso y competencias en el Ecosistema 360.',
};

export default function AnaliticasPage() {
    return <AnaliticasClient />;
}
