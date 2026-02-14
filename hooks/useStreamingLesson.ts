/**
 * Streaming Client Hook
 * Hook de React para consumir el endpoint de streaming.
 */

import { useState, useCallback, useRef } from 'react';

interface StreamOptions {
    semanaId: string | number;
    dia: string | number;
    pomodoroIndex: string | number;
}

export interface QuizQuestion {
    pregunta: string;
    opciones: string[];
    respuesta_correcta: string;
}

interface SSEEvent {
    type: 'start' | 'chunk' | 'quiz' | 'end' | 'error';
    text?: string;
    accumulated?: number;
    question?: QuizQuestion;
    error?: string;
}

export function useStreamingLesson() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [content, setContent] = useState('');
    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Use ref to accumulate quiz questions during streaming (avoids stale closure)
    const quizRef = useRef<QuizQuestion[]>([]);

    const streamLesson = useCallback(async ({ semanaId, dia, pomodoroIndex }: StreamOptions) => {
        setIsStreaming(true);
        setContent('');
        setQuiz([]);
        setError(null);
        setProgress(0);
        quizRef.current = [];

        try {
            const response = await fetch('/api/v1/lessons/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semanaId, dia, pomodoroIndex })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';

            const processEvents = (raw: string) => {
                for (const line of raw.split('\n\n')) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const event: SSEEvent = JSON.parse(trimmed.slice(6));
                        switch (event.type) {
                            case 'chunk':
                                if (event.text) {
                                    setContent(prev => prev + event.text);
                                    if (event.accumulated) {
                                        setProgress(Math.min(95, Math.floor((event.accumulated / 3000) * 100)));
                                    }
                                }
                                break;
                            case 'quiz':
                                if (event.question) {
                                    quizRef.current = [...quizRef.current, event.question];
                                    setQuiz([...quizRef.current]);
                                }
                                break;
                            case 'end':
                                setProgress(100);
                                break;
                            case 'error':
                                setError(event.error || 'Unknown streaming error');
                                break;
                        }
                    } catch (e) {
                        console.warn('Error parsing SSE event:', e);
                    }
                }
            };

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lastSep = buffer.lastIndexOf('\n\n');
                if (lastSep !== -1) {
                    processEvents(buffer.slice(0, lastSep));
                    buffer = buffer.slice(lastSep + 2);
                }
            }

            // Process remaining buffer after stream ends
            if (buffer.trim()) {
                processEvents(buffer);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsStreaming(false);
        setContent('');
        setQuiz([]);
        setError(null);
        setProgress(0);
        quizRef.current = [];
    }, []);

    return {
        streamLesson,
        reset,
        isStreaming,
        content,
        quiz,
        error,
        progress
    };
}

export default useStreamingLesson;
