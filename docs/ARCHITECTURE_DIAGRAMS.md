# Diagramas de Arquitectura - AI Code Mentor

## 1. Vista General del Sistema (C4 - Contexto)

```mermaid
graph TB
    subgraph Usuarios
        U[👤 Estudiante]
        A[👨‍💻 Admin]
    end

    subgraph "AI Code Mentor"
        FE[🖥️ Frontend\nNext.js]
        API[⚡ API Layer\nNext.js API Routes]
        DB[(💾 SQLite\nDB)]
    end

    subgraph Servicios Externos
        GEMINI[🤖 Gemini API\nGeneración IA]
    end

    U --> FE
    A --> FE
    FE --> API
    API --> DB
    API --> GEMINI

    style FE fill:#61DAFB,color:#000
    style API fill:#68A063,color:#fff
    style DB fill:#003B57,color:#fff
    style GEMINI fill:#4285F4,color:#fff
```

---

## 2. Flujo de Generación de Lecciones (Secuencia)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend
    participant API as /api/v1/lessons/generate
    participant LC as LessonController
    participant AI as Gemini API
    participant DB as SQLite

    U->>FE: Solicitar lección
    FE->>API: POST /generate
    API->>LC: generateLesson(params)
    LC->>DB: Cargar contexto usuario
    DB-->>LC: UserEntityMemory
    LC->>AI: Prompt + Contexto
    AI-->>LC: Contenido generado
    LC->>DB: Guardar sesión
    LC-->>API: LessonResponse
    API-->>FE: JSON Response
    FE-->>U: Renderizar lección
```

---

## 3. Modelo de Datos (ERD Simplificado)

```mermaid
erDiagram
    users ||--o{ sessions : "tiene"
    users ||--o{ progress : "registra"
    sessions ||--o{ lesson_logs : "genera"
    
    users {
        int id PK
        string email UK
        string password_hash
        datetime created_at
    }
    
    sessions {
        int id PK
        int user_id FK
        string jwt_token
        datetime expires_at
    }
    
    progress {
        int id PK
        int user_id FK
        int week_id
        int module_id
        float completion_pct
    }
    
    lesson_logs {
        int id PK
        int session_id FK
        string lesson_type
        json content
        datetime created_at
    }
```

---

## 4. Jerarquía de Componentes Frontend

```mermaid
graph TD
    App[_app.js]
    App --> AuthProvider
    App --> LessonProvider
    App --> ProjectTrackingProvider
    
    subgraph Pages
        Index[index.js]
        Codigo[codigo.js]
        Modulos[modulos.js]
        Panel[panel-de-control.js]
    end
    
    subgraph Components
        AuthModal[AuthModal]
        ModuleManager[ModuleManager]
        LessonViewer[LessonViewer]
        CodeEditor[CodeEditor]
    end
    
    subgraph "UI Atoms"
        Button[Button]
        SimpleInput[SimpleInput]
        Modal[Modal]
    end
    
    Index --> AuthModal
    Modulos --> ModuleManager
    Codigo --> LessonViewer
    Codigo --> CodeEditor
    AuthModal --> Button
    AuthModal --> SimpleInput
    ModuleManager --> Modal

    style App fill:#61DAFB
    style AuthProvider fill:#764ABC
    style LessonProvider fill:#764ABC
```

---

## 5. Flujo de Autenticación

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    Unauthenticated --> Loading: checkSession()
    Loading --> Authenticated: JWT válido
    Loading --> Unauthenticated: Sin sesión
    
    Unauthenticated --> LoginForm: Click "Iniciar Sesión"
    LoginForm --> Loading: Submit credentials
    
    Authenticated --> Unauthenticated: logout()
    Authenticated --> [*]
```

---

> **Nota**: Estos diagramas usan [Mermaid](https://mermaid.js.org/) y se renderizan automáticamente en GitHub, VS Code, y la mayoría de viewers de Markdown modernos.
