/**
 * Utilidades de Accesibilidad (a11y)
 */

export function generateA11yId(prefix = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof window === 'undefined') return;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function handleKeyboardNavigation(
    event: React.KeyboardEvent | KeyboardEvent,
    itemsCount: number,
    currentIndex: number,
    setIndex: (index: number) => void
): void {
    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            event.preventDefault();
            setIndex((currentIndex + 1) % itemsCount);
            break;
        case 'ArrowUp':
        case 'ArrowLeft':
            event.preventDefault();
            setIndex((currentIndex - 1 + itemsCount) % itemsCount);
            break;
    }
}

export function getProgressDescription(current: number, max: number): string {
    const percentage = Math.round((current / max) * 100);
    return `${percentage}% completado, ${current} de ${max}`;
}

export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
