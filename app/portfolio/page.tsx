import { Metadata } from 'next';
import PortfolioClient from './PortfolioClient';

export const metadata: Metadata = {
    title: 'Portfolio',
    description: 'Tu portfolio de proyectos y evidencias de competencias profesionales.',
};

export default function PortfolioPage() {
    return <PortfolioClient />;
}
