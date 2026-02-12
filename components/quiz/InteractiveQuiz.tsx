'use client';

import { useState } from 'react';
import { logger } from '@/lib/observability/Logger';

interface QuizExercise {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
}

interface InteractiveQuizProps {
    exercises: QuizExercise[];
    lessonId: string;
    topic?: string;
}

export default function InteractiveQuiz(props: InteractiveQuizProps) {
    const { exercises } = props;
    const [quizState, setQuizState] = useState(() =>
        exercises.map(() => ({
            userSelection: null as number | null,
            isAnswered: false
        }))
    );

    const handleAnswerSelection = async (questionIndex: number, optionIndex: number) => {
        if (quizState[questionIndex].isAnswered) return;

        const isCorrect = optionIndex === exercises[questionIndex].correctAnswerIndex;

        // Optimistic UI update
        setQuizState(prev => {
            const newState = [...prev];
            newState[questionIndex] = {
                userSelection: optionIndex,
                isAnswered: true
            };
            return newState;
        });

        // Persist attempt (Phase 11: Automation)
        try {
            await fetch('/api/v1/quizzes/attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: props.lessonId,
                    questionIndex,
                    userAnswer: optionIndex,
                    correctAnswer: exercises[questionIndex].correctAnswerIndex,
                    isCorrect,
                    topic: props.topic
                })
            });
        } catch (error) {
            logger.error('Quiz error saving attempt', error);
        }
    };

    const resetAllQuiz = () => {
        setQuizState(exercises.map(() => ({
            userSelection: null,
            isAnswered: false
        })));
    };

    if (!exercises || exercises.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
                <h5 className="font-bold text-indigo-900">🎯 Autoevaluación Pedagógica</h5>
                <button onClick={resetAllQuiz} className="text-xs text-indigo-600 hover:underline">Reiniciar Quiz</button>
            </div>

            <div className="space-y-6">
                {exercises.map((ex, qIdx) => {
                    const state = quizState[qIdx];
                    const isCorrect = state.isAnswered && state.userSelection === ex.correctAnswerIndex;

                    return (
                        <div key={qIdx} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <h6 className="font-semibold mb-3">{qIdx + 1}. {ex.question}</h6>
                            <div className="space-y-2">
                                {ex.options.map((opt, oIdx) => {
                                    let styles = "w-full text-left p-3 rounded-lg text-sm border transition-all ";
                                    if (!state.isAnswered) {
                                        styles += "bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300";
                                    } else {
                                        if (oIdx === ex.correctAnswerIndex) styles += "bg-green-100 border-green-400 text-green-900 font-bold";
                                        else if (oIdx === state.userSelection) styles += "bg-red-100 border-red-400 text-red-900";
                                        else styles += "bg-gray-100 opacity-60";
                                    }

                                    return (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleAnswerSelection(qIdx, oIdx)}
                                            disabled={state.isAnswered}
                                            className={styles}
                                        >
                                            <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>

                            {state.isAnswered && (
                                <div className={`mt-4 p-3 rounded-lg text-sm border animate-in slide-in-from-top-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <p className="font-bold mb-1">{isCorrect ? '✨ ¡Excelente!' : '📚 Sigue estudiando'}</p>
                                    {ex.explanation && <p className="text-gray-700 italic">{ex.explanation}</p>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
