import { Metadata } from 'next';
import PeerReviewClient from './PeerReviewClient';

export const metadata: Metadata = {
    title: 'Peer Review',
    description: 'Sistema de revisión entre pares con auditoría de código basada en IA.',
};

export default function PeerReviewPage() {
    return <PeerReviewClient />;
}
