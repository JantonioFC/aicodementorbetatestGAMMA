import React, { useState } from 'react';

/**
 * Componente de Feedback para Lecciones y Revisiones de IA
 * Permite calificar la utilidad, dificultad y dejar comentarios.
 */
const LessonFeedback = ({ lessonId, sessionId, onFeedbackSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [wasHelpful, setWasHelpful] = useState(null);
    const [difficulty, setDifficulty] = useState(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Por favor, selecciona una puntuación antes de enviar.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/lessons/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonId,
                    sessionId,
                    rating,
                    wasHelpful: wasHelpful === true,
                    difficulty,
                    comment: comment.trim() || null
                }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar el feedback');
            }

            setIsSubmitted(true);
            if (onFeedbackSubmitted) onFeedbackSubmitted();
        } catch (err) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-lg font-bold text-green-800 mb-1">¡Gracias por tu feedback!</h3>
                <p className="text-green-600">Tus respuestas nos ayudan a entrenar mejor a la IA para tus próximas lecciones.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="mr-2">💡</span> ¿Qué te pareció esta revisión/lección?
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Rating Stars */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Calificación general
                    </label>
                    <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`text-3xl transition-all duration-200 transform hover:scale-110 ${star <= (hover || rating) ? 'text-yellow-400' : 'text-slate-300'
                                    }`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                            >
                                ★
                            </button>
                        ))}
                        <span className="ml-3 text-sm text-slate-500">
                            {rating > 0 ? `${rating} de 5 estrellas` : 'Selecciona una puntuación'}
                        </span>
                    </div>
                </div>

                {/* Binary Helpful */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        ¿Fue útil para tu aprendizaje?
                    </label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => setWasHelpful(true)}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all flex items-center justify-center ${wasHelpful === true
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            <span className="mr-2">👍</span> Sí, mucho
                        </button>
                        <button
                            type="button"
                            onClick={() => setWasHelpful(false)}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all flex items-center justify-center ${wasHelpful === false
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            <span className="mr-2">👎</span> No realmente
                        </button>
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        ¿Cómo calificarías la dificultad?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'TOO_EASY', label: 'Muy fácil', icon: '👶' },
                            { id: 'JUST_RIGHT', label: 'Adecuada', icon: '🎯' },
                            { id: 'TOO_HARD', label: 'Muy difícil', icon: '🧠' }
                        ].map((d) => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setDifficulty(d.id)}
                                className={`py-2 px-1 rounded-lg border-2 text-sm transition-all text-center ${difficulty === d.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    }`}
                            >
                                <div className="text-lg mb-1">{d.icon}</div>
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        ¿Algún comentario adicional? (Opcional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                        placeholder="Escribe aquí tus sugerencias o qué podríamos mejorar..."
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                        ⚠ {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all transform active:scale-95 ${isSubmitting || rating === 0
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
                        }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando feedback...
                        </span>
                    ) : 'Enviar Valoración'}
                </button>
            </form>
        </div>
    );
};

export default LessonFeedback;
