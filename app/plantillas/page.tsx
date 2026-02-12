import React from 'react';
import { Metadata } from 'next';
import TemplatesClient from './TemplatesClient';

export const metadata: Metadata = {
    title: 'Plantillas Educativas',
    description: 'Sistema completo de plantillas metodológicas del Ecosistema 360.',
};

export default function TemplatesPage() {
    return <TemplatesClient />;
}
