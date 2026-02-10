
import { useState, useEffect, ChangeEvent } from 'react';

/**
 * Dominios disponibles
 */
interface Domain {
    id: string;
    name: string;
    icon: string;
}

const DOMAINS: Domain[] = [
    { id: 'programming', name: 'Programación', icon: '🖥️' },
    { id: 'logic', name: 'Lógica', icon: '🧠' },
    { id: 'databases', name: 'Bases de Datos', icon: '🗄️' },
    { id: 'math', name: 'Matemáticas', icon: '📐' }
];

const STORAGE_KEY = 'studyDomain';

interface DomainSelectorProps {
    onChange?: (domain: string) => void;
    className?: string;
}

/**
 * Selector de dominio de estudio
 */
export default function DomainSelector({ onChange, className = '' }: DomainSelectorProps) {
    const [selectedDomain, setSelectedDomain] = useState<string>('programming');

    // Cargar dominio guardado al montar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && DOMAINS.find(d => d.id === saved)) {
                setSelectedDomain(saved);
                onChange?.(saved);
            }
        }
    }, [onChange]);

    // Manejar cambio de dominio
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newDomain = event.target.value;
        setSelectedDomain(newDomain);

        // Persistir en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newDomain);
        }

        // Notificar al padre
        onChange?.(newDomain);
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm text-gray-600">Modo:</span>
            <select
                value={selectedDomain}
                onChange={handleChange}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                aria-label="Seleccionar dominio de estudio"
            >
                {DOMAINS.map(domain => (
                    <option key={domain.id} value={domain.id}>
                        {domain.icon} {domain.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Hook para obtener el dominio actual
 */
export function useDomain() {
    const [domain, setDomainState] = useState<string>('programming');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setDomainState(saved);
        }
    }, []);

    const setDomain = (newDomain: string) => {
        setDomainState(newDomain);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newDomain);
        }
    };

    const domainInfo = DOMAINS.find(d => d.id === domain) || DOMAINS[0];

    return { domain, setDomain, domainInfo, availableDomains: DOMAINS };
}
