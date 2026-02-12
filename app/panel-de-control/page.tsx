import React from 'react';
import DashboardClient from './DashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Panel de Control - AI Code Mentor',
    description: 'Dashboard principal del ecosistema educativo Ecosistema 360',
};

/**
 * Panel de Control (App Router)
 * Server Component que renderiza el cliente del Dashboard.
 */
export default function PanelDeControlPage() {
    return <DashboardClient />;
}
