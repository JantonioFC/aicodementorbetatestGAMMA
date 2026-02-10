import { useState } from 'react';

interface Exercise {
    question?: string;
    options?: string[];
    correctAnswerIndex?: number;
    correctAnswer?: string;
    explanation?: string;
    type?: string;
}

interface QuizProps {
    exercise: Exercise | string;
    questionNumber: number;
}

export default function Quiz({ exercise, questionNumber }: QuizProps) {
    const [userSelection, setUserSelection] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const ex = typeof exercise === 'string' ? { question: exercise } : exercise;

    const handleSelectOption = (selectedOptionIndex: number, selectedOption: string) => {
        if (isAnswered) return;

        setUserSelection(selectedOptionIndex);
        setIsAnswered(true);

        let isAnswerCorrect = false;
        if (typeof ex.correctAnswerIndex === 'number') {
            isAnswerCorrect = selectedOptionIndex === ex.correctAnswerIndex;
        } else if (ex.correctAnswer) {
            isAnswerCorrect =
                selectedOption === ex.correctAnswer ||
                String.fromCharCode(65 + selectedOptionIndex) === ex.correctAnswer ||
                selectedOption.trim().toLowerCase() === ex.correctAnswer.trim().toLowerCase();
        }

        setIsCorrect(isAnswerCorrect);
    };

    const getOptionStyle = (optionIndex: number) => {
        if (!isAnswered) return "flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50";
        if (optionIndex === userSelection) {
            return isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50";
        }
        return "border-gray-200 bg-gray-50 opacity-60";
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm">
            <h6 className="font-bold text-green-800 mb-2">📝 Pregunta {questionNumber}</h6>
            <p className="text-gray-800 mb-4">{ex.question}</p>

            {ex.options && (
                <div className="space-y-2 mb-4">
                    {ex.options.map((option, idx) => (
                        <div key={idx} onClick={() => handleSelectOption(idx, option)} className={`p-3 border rounded-md transition-all ${getOptionStyle(idx)}`}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)})</span>
                            {option}
                        </div>
                    ))}
                </div>
            )}

            {isAnswered && (
                <div className="space-y-2 mt-4 animate-in fade-in">
                    <div className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {isCorrect ? '🎉 ¡Correcto!' : `❌ Incorrecto. La respuesta era: ${ex.correctAnswer || (ex.options && typeof ex.correctAnswerIndex === 'number' ? ex.options[ex.correctAnswerIndex] : '')}`}
                    </div>
                    {ex.explanation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded">
                            <strong>💡 Explicación:</strong> {ex.explanation}
                        </div>
                    )}
                    <button onClick={() => { setIsAnswered(false); setUserSelection(null); }} className="text-xs text-gray-500 underline">Reintentar</button>
                </div>
            )}
        </div>
    );
}
