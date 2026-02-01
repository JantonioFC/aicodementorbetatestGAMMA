# 🎓 AI Code Mentor - Ecosistema 360 | Plataforma Educativa Completa

## 📋 Descripción

**AI Code Mentor - Ecosistema 360** es una plataforma completa de aprendizaje autogestionado que implementa la metodología educativa **Ecosistema 360** con **Simbiosis Crítica Humano-IA**. 

Combina un currículo estructurado de 24 meses (8 fases: F0-F7) con herramientas profesionales de gestión de portfolio, plantillas educativas y analíticas de progreso avanzadas.

## 🏗️ Arquitectura Actual: v23.0 - AI Best Practices Edition 🚀

**Sistema Operacional:** Plataforma educativa basada en **Next.js Modular Monolith** con:
- **SQLite Local** + Migraciones automáticas
- **Búsqueda Semántica Avanzada** (Embeddings + Reranking + Query Expansion)
- **Evaluación "LLM-as-Judge"** con métricas formales
- **Observabilidad Completa** (Tracing + Métricas + Alertas)

### ✨ Nuevas Capacidades (v23.0):

| Característica | Descripción |
|:---------------|:------------|
| 🧠 **Advanced RAG** | Semantic Chunking + Reranking + Query Expansion |
| ⚖️ **LLM Evaluation** | "LLM-as-Judge" + Métricas (ROUGE/BLEU) |
| 🔄 **Prompt Versioning** | A/B Testing y gestión de versiones de prompts |
| 💾 **Advanced Memory** | Entity Memory + Memory Consolidation + Decay |
| 📊 **Observability** | Dashboard de métricas y Tracing distribuido |
| 🎨 **Multimodal** | Imágenes (Fal.ai), Diagramas (Mermaid), TTS |

### Stack Tecnológico:

| Capa | Tecnología |
|:-----|:-----------|
| **Frontend** | Next.js 15+ + React 18 + TailwindCSS |
| **Backend** | Next.js API Routes (v1 RESTful) |
| **Base de Datos** | SQLite (better-sqlite3) + Embeddings Vectoriales |
| **IA** | Gemini 1.5 Pro/Flash (Resilient Router) |
| **Testing** | Jest (125+ tests) + Playwright |
| **Monitoring** | Custom Metrics Collector (Prometheus compatible) |

## 🚀 Instalación

### Prerrequisitos:
- Node.js 18+
- API key de Gemini (Google AI Studio)

### Pasos:

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/ai-code-mentor.git
cd ai-code-mentor

# 2. Instalar
npm install

# 3. Configurar
cp .env.example .env.local
# Editar .env.local con tu GEMINI_API_KEY y FAL_API_KEY

# 4. Ejecutar migraciones
node scripts/migrate.js

# 5. Indexar currículo
node scripts/index-curriculum.js

# 6. Iniciar
npm run dev
```

## 🔧 Variables de Entorno

```bash
# .env.local

# Requeridas
GEMINI_API_KEY=tu-gemini-api-key
JWT_SECRET=tu-secreto-aleatorio

# Opcionales (para features avanzados)
FAL_API_KEY=xxx              # Generación de imágenes (Flux)
GOOGLE_TTS_API_KEY=xxx       # Text-to-Speech
```

## 📡 API Endpoints

### Lecciones
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| POST | `/api/v1/lessons/generate` | Genera una lección (soporta parámetros v2) |
| POST | `/api/v1/lessons/feedback` | Envía feedback |

### Monitoring & Metrics (¡Nuevo!)
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| GET | `/api/v1/metrics` | Métricas del sistema (JSON) |
| GET | `/api/v1/metrics?format=prometheus` | Formato Prometheus |

### Multimodal
| Método | Endpoint | Descripción |
|:-------|:---------|:------------|
| POST | `/api/v1/multimodal/diagram` | Genera diagrama Mermaid |
| POST | `/api/v1/tts/synthesize` | Text-to-Speech |

## 🧪 Testing

El proyecto cuenta con una suite de **125 tests automatizados** cubriendo lógica de negocio, integración IA y nuevos módulos Data/AI.

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests de nuevos módulos (RAG/Prompts)
npm test __tests__/lib/rag/SemanticChunker.test.js
```

## 📁 Estructura del Proyecto

```
lib/
├── ai/router/          # GeminiRouter con Circuit Breaker
├── context/            # Context Window Manager
├── db/                 # SQLite + Migraciones
├── evaluation/         # LLMJudgeEvaluator, RegressionTester
├── memory/             # UserEntityMemory, MemoryConsolidator
├── multimodal/         # Diagramas, Imágenes, TTS
├── observability/      # Tracer, Metrics, Alerts
├── prompts/            # PromptVersionManager, Versions
├── rag/                # Reranker, SemanticChunker, Retrievers
├── repositories/       # SessionRepository, WeekRepository
├── services/           # LessonService
└── utils/              # TokenBudgetManager, Logger
```

## 📝 Licencia

**Copyright © 2026 AI Code Mentor Team. All Rights Reserved.**

El uso no autorizado, duplicación o distribución de este software está estrictamente prohibido.

---

**Última actualización:** Febrero 01, 2026  
**Versión:** v23.0-stable  
**Estado:** ✅ **PRODUCTION READY** - 100% Data/AI Best Practices
