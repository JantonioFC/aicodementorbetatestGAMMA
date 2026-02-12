import { Metadata } from 'next';
import CrearPlantillaClient from './CrearPlantillaClient';

export const metadata: Metadata = {
    title: 'Crear Plantilla',
    description: 'Crea plantillas educativas personalizadas para el Ecosistema 360.',
};

export default function CrearPlantillaPage() {
    return <CrearPlantillaClient />;
}
