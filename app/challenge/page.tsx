import { Metadata } from 'next';
import ChallengeClient from './ChallengeClient';

export const metadata: Metadata = {
    title: 'Desafíos',
    description: 'Desafíos de programación para demostrar tus habilidades.',
};

export default function ChallengePage() {
    return <ChallengeClient />;
}
