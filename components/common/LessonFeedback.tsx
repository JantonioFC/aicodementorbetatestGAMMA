
import { useState } from 'react';
import { SimpleInput } from '../ui/atoms/SimpleInput'; // Adjust import if needed

interface LessonFeedbackProps {
    lessonId: string | number;
    onSubmit?: (data: { rating: number; comment: string }) => void;
    className?: string;
}

export default function LessonFeedback({ lessonId, onSubmit, className = '' }: LessonFeedbackProps) {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);

        try {
            // Simular envío a API (o implementar llamada real aquí si hubiera un servicio de feedback)
            // await feedbackService.submit({ lessonId, rating, comment });

            // Por ahora, solo log y callback
            console.log('Feedback submitted:', { lessonId, rating, comment });

            if (onSubmit) {
                onSubmit({ rating, comment });
            }

            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className={`text-center p-6 bg-green-500/10 border border-green-500/20 rounded-xl animate-in fade-in duration-300 ${className}`}>
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-lg font-semibold text-green-400">¡Gracias por tu feedback!</h3>
                <p className="text-sm text-gray-400 mt-1">Tu opinión nos ayuda a mejorar el mentor.</p>
            </div>
        );
    }

    return (
        <div className={`bg-[#1A1D24] border border-gray-800 rounded-xl p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Califica esta lección</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Estrellas */}
                <div className="flex gap-2 justify-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-600'
                                }`}
                            aria-label={`Calificar con ${star} estrellas`}
                        >
                            ★
                        </button>
                    ))}
                </div>

                {/* Comentario Opcional */}
                <div>
                    <SimpleInput
                        id={`feedback-comment-${lessonId}`} // Unique ID
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="¿Qué te gustó? ¿Qué podríamos mejorar? (Opcional)"
                        className="w-full"
                        inputClassName="bg-[#0F1115] border-gray-700 focus:border-blue-500"
                    />
                </div>

                {/* Botón Enviar */}
                <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className={`
                        w-full py-2.5 px-4 rounded-lg font-medium text-sm
                        transition-all duration-200
                        ${rating === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }
                        ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                    `}
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </button>
            </form>
        </div>
    );
}
