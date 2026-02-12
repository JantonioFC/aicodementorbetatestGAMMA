import { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Tu panel principal de progreso y métricas en el Ecosistema 360.',
};

export default function DashboardPage() {
    return <DashboardClient />;
}
