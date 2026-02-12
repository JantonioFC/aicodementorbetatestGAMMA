import React from 'react';
import { useLessonContext } from '../contexts/LessonContext';
import IntegratedExerciseEnvironment from './IntegratedExerciseEnvironment';
import { useCurriculumSource } from '../hooks/modules/useCurriculumSource';
import { useLessonSelection } from '../hooks/modules/useLessonSelection';
import { useCacheControl } from '../hooks/modules/useCacheControl';

interface CurriculumLessonInfo {
  title: string;
  topics: string[];
  difficulty: string;
  estimated_time: string;
  source_url: string;
}

type Curriculum = Record<string, Record<string, Record<string, CurriculumLessonInfo>>>;

export default function ModuleManager() {
  // 1. Hooks de Datos y Lógica
  const curriculum = useCurriculumSource().curriculum as Curriculum;
  const sourceError = useCurriculumSource().error;

  const {
    selectedLanguage, selectedCategory, selectedLesson,
    setLanguage, setCategory, setLesson, resetSelection: resetLocalSelection,
    availableCategories, availableLessons, currentLessonInfo
  } = useLessonSelection(curriculum);

  const { clearCache, isClearing } = useCacheControl();

  // 2. Contexto Global
  const {
    currentLesson,
    isLoading,
    error: ctxError,
    loadingProgress,
    lessonHistory,
    generateLesson,
    clearCurrentLesson,
    reloadCurrentLesson
  } = useLessonContext();

  const handleLessonSelection = async () => {
    if (selectedLanguage && selectedCategory && selectedLesson) {
      await generateLesson(selectedLanguage, selectedCategory, selectedLesson);
    }
  };

  const handleReset = () => {
    clearCurrentLesson();
    resetLocalSelection();
  };

  const finalError = (sourceError as unknown as string) || ctxError;



  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 rounded-full text-sm mb-4">
          📚 Biblioteca Viva - V4.0
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Gestión de Lecciones
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Selecciona lecciones del curriculum oficial y genera contenido educativo dinámico
        </p>
        <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-gray-700 rounded-full text-sm">
          🔄 Flujo: Fuentes Oficiales → IA → Lecciones → Ejercicios Ejecutables → Auto-Guardado
        </div>

        {/* Controles de Sistema V4.1 */}
        <div className="mt-4 flex justify-center space-x-3">
          <button
            onClick={clearCache}
            disabled={isClearing}
            className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
          >
            {isClearing ? '🔄 Limpiando...' : '🧺 Limpiar Cache'}
          </button>
          <div className="text-xs text-gray-500 flex items-center">
            🔧 V4.2 - Ejercicios Ejecutables + Auto-Guardado 100% Automático
          </div>

          {/* Auto-Save Status V4.2 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-green-800">
                💾 Sistema de Auto-Guardado V4.2
              </h4>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                ✅ AUTOMÁTICO
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Lección guardada automáticamente</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">💾</span>
                <span>Formatos JSON + Markdown</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">📁</span>
                <span>Ubicación: /exports/lecciones/</span>
              </div>
            </div>

            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
              🔥 <strong>Sin intervención manual:</strong> Todo se guarda automáticamente - lecciones, ejercicios, código, correcciones y progreso.
            </div>
          </div>
        </div>
      </header>

      {!currentLesson ? (
        /* Selection Section */
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              1. Selecciona el Lenguaje de Programación
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(curriculum).map((language) => (
                <button
                  key={language}
                  onClick={() => setLanguage(language)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${selectedLanguage === language
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <div className="font-medium capitalize">
                    {language === 'python' && '🐍'}
                    {language === 'javascript' && '🟨'}
                    {language === 'react' && '⚛️'}
                    {language}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {curriculum[language] ? Object.keys(curriculum[language]).length : 0} categorías disponibles
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          {selectedLanguage && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                2. Selecciona la Categoría
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategory(category)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedCategory === category
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    <div className="font-medium capitalize">
                      📖 {category.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {curriculum[selectedLanguage][category] ? Object.keys(curriculum[selectedLanguage][category]).length : 0} lecciones
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Selection */}
          {selectedCategory && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                3. Selecciona la Lección Específica
              </label>
              <div className="grid grid-cols-1 gap-3">
                {availableLessons.map((lesson) => {
                  const lessonInfo = curriculum[selectedLanguage][selectedCategory][lesson];
                  return (
                    <button
                      key={lesson}
                      onClick={() => setLesson(lesson)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${selectedLesson === lesson
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{lessonInfo.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {lessonInfo.topics.join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${lessonInfo.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            lessonInfo.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {lessonInfo.difficulty}
                          </span>
                          <span className="text-gray-500">
                            ⏱️ {lessonInfo.estimated_time}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button */}
          {selectedLesson && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-medium text-purple-800 mb-2">
                  🎯 Lección Seleccionada: {currentLessonInfo?.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
                  <div>
                    <strong>Fuente Oficial:</strong>
                    <a
                      href={currentLessonInfo?.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Ver documentación
                    </a>
                  </div>
                  <div>
                    <strong>Tiempo estimado:</strong> {currentLessonInfo?.estimated_time}
                  </div>
                </div>
                <button
                  onClick={handleLessonSelection}
                  disabled={isLoading}
                  className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '🔄 Generando Lección...' : '🚀 Generar Lección con IA'}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Generando contenido educativo desde fuente oficial...</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {finalError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-400 mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error al generar lección</h3>
                  <p className="text-sm text-red-700 mt-1">{finalError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Historial de Lecciones (solo si hay historial) */}
          {lessonHistory && lessonHistory.length > 0 && (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-800 mb-3">📋 Lecciones Recientes:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lessonHistory.slice(0, 6).map((historyItem, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-purple-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-purple-800">
                        {historyItem.title}
                      </div>
                      <div className="text-xs text-purple-600">
                        {historyItem.path} • {new Date(historyItem.accessed_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${historyItem.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      historyItem.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {historyItem.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-3">🌟 Biblioteca Viva - Cómo Funciona:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <strong>📖 Fuentes Oficiales:</strong> Contenido siempre actualizado desde docs.python.org, MDN, react.dev
              </div>
              <div>
                <strong>🤖 IA Gemini:</strong> Transforma documentación técnica en lecciones educativas
              </div>
              <div>
                <strong>💾 Sistema de Caché:</strong> Optimiza rendimiento con almacenamiento inteligente
              </div>
              <div>
                <strong>🔄 Auto-Actualización:</strong> Detecta cambios en fuentes oficiales automáticamente
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lesson Display Section */
        <div className="space-y-6">
          {/* Lesson Info */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  📚 {currentLesson.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-green-700 mt-2">
                  <span>🏷️ {currentLesson.difficulty}</span>
                  <span>⏱️ {currentLesson.estimated_time}</span>
                  <span>📍 {currentLesson.path}</span>
                  {currentLesson.cached && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      💾 Cached
                    </span>
                  )}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  🌐 Fuente: <a href={currentLesson.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
                    {currentLesson.source_url}
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={reloadCurrentLesson}
                  className="px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors text-sm"
                  disabled={isLoading}
                >
                  ♾️ Recargar
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                >
                  🔄 Nueva Lección
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <h4 className="text-xl font-medium text-gray-800">
                📖 Contenido Educativo
              </h4>
              <div className="ml-auto flex items-center text-xs text-gray-500">
                🤖 Generado por IA • {currentLesson.generated_at ? new Date(currentLesson.generated_at).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700">
              <div className="whitespace-pre-wrap leading-relaxed">
                {currentLesson.content}
              </div>
            </div>
          </div>

          {/* Auto-Save Confirmation V4.2 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-green-800">
                ✅ Lección Auto-Guardada V4.2
              </h4>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                AUTOMÁTICO
              </div>
            </div>

            <p className="text-sm text-green-700 mb-4">
              Esta lección se guardó automáticamente en tu biblioteca personal sin necesidad de intervención manual.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">📁</span>
                <span>Archivo JSON de datos</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">📄</span>
                <span>Archivo Markdown legible</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">📊</span>
                <span>Progreso registrado automáticamente</span>
              </div>
            </div>

            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
              📂 <strong>Ubicación:</strong> /exports/lecciones/ • <strong>Timestamp:</strong> {currentLesson.generated_at ? new Date(currentLesson.generated_at).toLocaleString() : 'N/A'}
            </div>
          </div>

          {/* Integrated Exercise Environment V4.2 */}
          {currentLesson.exercises && currentLesson.exercises.length > 0 && (
            <IntegratedExerciseEnvironment
              exercises={currentLesson.exercises.map(ex => ex.question)}
              lessonPath={currentLesson.path}
              language={currentLesson.path.split('.')[0]}
            />
          )}

          {/* Topics Covered */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h5 className="font-medium text-purple-800 mb-3">🎯 Temas Cubiertos:</h5>
            <div className="flex flex-wrap gap-2">
              {currentLesson.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h5 className="font-medium text-blue-800 mb-3">🚀 Próximos Pasos:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span>Lección completada</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">🔄</span>
                <span>Implementar ejercicios</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-500 mr-2">📋</span>
                <span>Verificar con análisis de código</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}