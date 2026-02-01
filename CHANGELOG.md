# Changelog

Todos los cambios notables en este proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [5.0.0] - 2026-02-01

### Añadido

#### Fase 9: Multimodal
- `lib/multimodal/DiagramGenerator.js` - Generación de diagramas Mermaid educativos
- `lib/multimodal/ImageGenerator.js` - Integración con fal.ai para imágenes
- `lib/multimodal/TextToSpeechService.js` - Text-to-Speech con fallback a browser
- `lib/multimodal/MultimodalService.js` - Orquestador de contenido multimodal
- `/api/v1/multimodal/capabilities` - Endpoint para consultar capacidades
- `/api/v1/multimodal/diagram` - Endpoint para generar diagramas
- `/api/v1/tts/synthesize` - Endpoint para síntesis de voz

#### Fase 8: Búsqueda Semántica
- `lib/rag/EmbeddingService.js` - Generación de embeddings con Gemini
- `scripts/index-curriculum.js` - Script para indexar currículo
- Búsqueda híbrida (keyword + vectorial) en ContentRetriever
- 1,540 pomodoros indexados con embeddings

#### Fase 7: Correcciones Prioritarias
- `lib/utils/TokenBudgetManager.js` - Control de tokens para evitar overflow
- `lib/evaluation/LessonEvaluator.js` - Evaluación automática de calidad
- Memory Injection en LessonService
- Migración 004: `lesson_evaluations`

#### Fase 6: AI & Data Maturity
- `lib/db/migrate.js` - Sistema de migraciones para SQLite
- `lib/repositories/SessionRepository.js` - Gestión de sesiones de aprendizaje
- Few-Shot Prompting en `LessonPrompts.js`
- RAG con `ContentRetriever.js`
- `/api/v1/lessons/feedback` - Feedback de lecciones

### Modificado
- `LessonService.js` - Integrado con TokenBudget, Evaluator, Multimodal
- `generate.js` - Acepta `userId` y `includeMultimodal`
- `ContentRetriever.js` - Añadida búsqueda híbrida

### Tests Añadidos
- `__tests__/lib/utils/TokenBudgetManager.test.js`
- `__tests__/lib/evaluation/LessonEvaluator.test.js`
- `__tests__/lib/multimodal/DiagramGenerator.test.js`
- `__tests__/lib/rag/EmbeddingService.test.js`
- `__tests__/lib/repositories/SessionRepository.test.js`

---

## [4.0.0] - 2026-01-31

### Añadido
- Arquitectura de capas (API → Service → Repository)
- Circuit Breaker para resiliencia
- Rate Limiter
- Logger estructurado
- API versionada v1

---

## [3.0.0] - 2026-01-30

### Añadido
- GeminiRouter con fallback de modelos
- WeekRepository para acceso a datos
- Middleware de validación

---

## [2.0.0] - 2026-01-29

### Añadido
- Currículo Ecosistema 360 en SQLite
- Esquema diario con pomodoros

---

## [1.0.0] - 2026-01-28

### Inicial
- Generación de lecciones con Gemini
- Quiz interactivo
- Estructura Next.js
