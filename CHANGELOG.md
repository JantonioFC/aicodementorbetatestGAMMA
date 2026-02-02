
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-02-01 (Round 4: Enterprise Ready)
### Added
- **State Management**: Zustand store (`lib/store/lessonStore.ts`) for complex session state.
- **Launch**: `LAUNCH_PLAN.md` and `ROADMAP.md` (RICE prioritized).
- **Docs**: `docs/ARCHITECTURE_DIAGRAMS.md` with Mermaid graphs.
- **Templates**: GitHub Issue Templates for bugs/features.

### Changed
- **API**: Migrated `APIWrapper.js` to strictly typed `APIWrapper.ts`.
- **UI**: Refactored `Button` and `Modal` for Accessibility (ARIA, Touch Targets).
- **Standards**: Enforced coding standards via `CONTRIBUTING.md`.

## [0.8.0] - 2026-02-01 (Round 3: Professional Standards)
### Added
- **Testing**: Jest Unit Tests for Agentic Logic (`SmartLessonGenerator`).
- **Docs**: OpenAPI Schema generation support.

### Changed
- **Config**: Migrated core config to TypeScript (`unifiedConfig.ts`).
- **Backend**: Implemented Layered Architecture (`LessonController`, `BaseController`).

## [0.5.0] - 2026-01-31 (Round 2: Architecture & Design)
### Added
- **Observability**: Metrics and Tracing stack.
- **E2E**: Playwright foundation.

### Changed
- **UI**: Complete "Industrial" Design Overhaul.
- **Architecture**: Clean Architecture decoupling.

## [0.1.0] - 2026-01-30 (Round 1: Data & AI)
### Added
- **RAG**: Semantic Chunker, Reranker, Query Expander.
- **Agent**: Smart Lesson Generator with Clarity Gate (0.7 threshold).
- **Memory**: User Entity Memory and Consolidation.
- **Eval**: LLM-as-a-Judge implementation.
