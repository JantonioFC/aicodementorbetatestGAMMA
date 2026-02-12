import { Metadata } from 'next';
import CodigoClient from './CodigoClient';

export const metadata: Metadata = {
    title: 'Análisis de Código',
    description: 'Analiza tu código con IA y genera lecciones interactivas.',
};

export default function CodigoPage() {
    return <CodigoClient />;
}
