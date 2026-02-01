/**
 * Streaming Client Hook
 * Hook de React para consumir el endpoint de streaming.
 */

import { useState, useCallback } from 'react';

export function useStreamingLesson() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [content, setContent] = useState('');
    const [lesson, setLesson] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const streamLesson = useCallback(async ({ semanaId, dia, pomodoroIndex }) => {
        setIsStreaming(true);
        setContent('');
        setLesson(null);
        setError(null);
        setProgress(0);

        try {
            const response = await fetch('/api/v1/lessons/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semanaId, dia, pomodoroIndex })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Procesar eventos SSE
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Mantener el último fragmento incompleto

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event = JSON.parse(line.slice(6));

                            switch (event.type) {
                                case 'start':
                                    // Evento de inicio con contexto
                                    break;

                                case 'chunk':
                                    setContent(prev => prev + event.text);
                                    // Estimar progreso basado en longitud esperada (~3000 chars)
                                    setProgress(Math.min(95, Math.floor((event.accumulated / 3000) * 100)));
                                    break;

                                case 'end':
                                    setLesson(event.data);
                                    setProgress(100);
                                    break;

                                case 'error':
                                    setError(event.error);
                                    break;
                            }
                        } catch (e) {
                            console.warn('Error parsing SSE event:', e);
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsStreaming(false);
        setContent('');
        setLesson(null);
        setError(null);
        setProgress(0);
    }, []);

    return {
        streamLesson,
        reset,
        isStreaming,
        content,
        lesson,
        error,
        progress
    };
}

export default useStreamingLesson;
