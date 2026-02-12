import { Metadata } from 'next';
import ModulosClient from './ModulosClient';

export const metadata: Metadata = {
    title: 'Módulos',
    description: 'Explora los módulos del curriculum de ingeniería de software.',
};

export default function ModulosPage() {
    return <ModulosClient />;
}
