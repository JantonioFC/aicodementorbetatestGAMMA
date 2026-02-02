
# Architecture Diagrams

## 1. System High-Level Overview

```mermaid
graph TD
    User[Developer / Student] -->|Access via Browser| Frontend[Next.js Frontend]
    Frontend -->|Auth (Supabase)| Auth[Auth Service]
    Frontend -->|API Request| API[Next.js API Routes]
    
    subgraph "Core Backend Services"
        API -->|Calls| LessonController[Lesson Controller]
        LessonController -->|Uses| SmartAgent[Smart Lesson Generator]
        LessonController -->|Uses| RAG[RAG Service]
    end
    
    subgraph "AI & Intelligence"
        SmartAgent -->|Queries| LLM[Google Gemini API]
        RAG -->|Retrieves| VectorDB[Vector Database / Semantic Search]
        SmartAgent -->|Validates| ClarityGate[Clarity Gate]
    end
    
    subgraph "Data Persistence"
        LessonController -->|Stores| DB[(PostgreSQL / File System)]
        API -->|Logs| Metrics[Observability Metrics]
    end
```

## 2. Agentic Lesson Generation Flow (Recursive)

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Agent as SmartLessonGenerator
    participant Gate as ClarityGate
    participant LLM

    User->>API: POST /generate (Topic)
    API->>Agent: generateWithAutonomy(Topic)
    Agent->>Agent: Check Cache / History
    
    loop Resilience Loop (Max 3 Retries)
        Agent->>LLM: Generate Prompt (v2.0 Storytelling)
        LLM-->>Agent: Draft Content
        Agent->>Gate: checkRelevance(Content)
        
        alt Content is Relevant (>0.7)
            Gate-->>Agent: Approved
            Note right of Agent: Break Loop
        else Content Low Quality
            Gate-->>Agent: Rejected (Feedback)
            Agent->>Agent: Refine Prompt (Query Expansion)
        end
    end
    
    Agent-->>API: Final Lesson Content (JSON)
    API-->>User: Render Lesson
```

## 3. Database Entity Relationship (Simplified)

```mermaid
erDiagram
    USER ||--o{ PROFILE : has
    USER ||--o{ LESSON_SESSION : "starts"
    LESSON_SESSION ||--|{ LESSON_HISTORY : "tracks"
    
    USER {
        string id PK
        string email
        datetime created_at
    }
    
    PROFILE {
        string user_id FK
        json skills_matrix
        string current_level
        int xp_points
    }
    
    LESSON_SESSION {
        string id PK
        string user_id FK
        string topic
        int current_step
        boolean is_completed
    }
```
