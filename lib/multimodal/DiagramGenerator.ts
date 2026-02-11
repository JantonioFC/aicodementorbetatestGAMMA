/**
 * Diagram Generator
 * Genera diagramas Mermaid para enriquecer las lecciones educativas.
 */

export class DiagramGenerator {
    /**
     * Genera un diagrama de flujo para un concepto de programación.
     * @param {string} concept - Concepto a ilustrar
     * @param {string} type - Tipo de diagrama: 'flowchart', 'sequence', 'mindmap'
     * @returns {string} Código Mermaid
     */
    public generateForConcept(concept: string, type: string = 'flowchart'): string {
        const normalizedConcept = concept.toLowerCase();

        // Plantillas predefinidas para conceptos comunes
        const templates: Record<string, string> = {
            // Estructuras de control
            'condicional': this._conditionalDiagram(),
            'if': this._conditionalDiagram(),
            'si-entonces': this._conditionalDiagram(),

            'bucle': this._loopDiagram(),
            'repetir': this._loopDiagram(),
            'loop': this._loopDiagram(),

            // Scratch específico
            'sprite': this._spriteDiagram(),
            'evento': this._eventDiagram(),
            'mensaje': this._messageDiagram(),

            // Algoritmos
            'algoritmo': this._algorithmDiagram(),
            'secuencia': this._sequenceDiagram(),
            'variable': this._variableDiagram(),
            'base de datos': this._erDiagram(),
            'entidad': this._erDiagram(),
            'estado': this._stateDiagram(),
            'flujo': this._stateDiagram(),
        };

        // Buscar plantilla por coincidencia parcial
        for (const [key, generator] of Object.entries(templates)) {
            if (normalizedConcept.includes(key)) {
                return generator;
            }
        }

        // Diagrama genérico si no hay coincidencia
        return this._genericConceptDiagram(concept);
    }

    /**
     * Genera un diagrama de flujo para lógica condicional.
     */
    private _conditionalDiagram(): string {
        return `\`\`\`mermaid
flowchart TD
    A[🚀 Inicio] --> B{¿Condición?}
    B -->|Sí| C[✅ Ejecutar Acción A]
    B -->|No| D[❌ Ejecutar Acción B]
    C --> E[🏁 Continuar]
    D --> E
    
    style A fill:#4CAF50,color:#fff
    style B fill:#FF9800,color:#fff
    style C fill:#2196F3,color:#fff
    style D fill:#9C27B0,color:#fff
    style E fill:#4CAF50,color:#fff
\`\`\``;
    }

    /**
     * Genera un diagrama de flujo para bucles/repeticiones.
     */
    private _loopDiagram(): string {
        return `\`\`\`mermaid
flowchart TD
    A[🚀 Inicio] --> B[Inicializar contador]
    B --> C{¿Contador < N?}
    C -->|Sí| D[🔄 Ejecutar acción]
    D --> E[Incrementar contador]
    E --> C
    C -->|No| F[🏁 Fin del bucle]
    
    style A fill:#4CAF50,color:#fff
    style C fill:#FF9800,color:#fff
    style D fill:#2196F3,color:#fff
    style F fill:#4CAF50,color:#fff
\`\`\``;
    }

    /**
     * Diagrama de sprites en Scratch.
     */
    private _spriteDiagram(): string {
        return `\`\`\`mermaid
flowchart LR
    subgraph Escenario["🎭 Escenario"]
        A[🐱 Sprite 1]
        B[🦊 Sprite 2]
        C[🎨 Fondo]
    end
    
    subgraph Propiedades["⚙️ Propiedades del Sprite"]
        D[📍 Posición X, Y]
        E[🔄 Dirección]
        F[👗 Disfraz]
        G[📏 Tamaño]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    
    style A fill:#4CAF50,color:#fff
    style B fill:#FF9800,color:#fff
    style C fill:#9C27B0,color:#fff
\`\`\``;
    }

    /**
     * Diagrama de eventos en Scratch.
     */
    private _eventDiagram(): string {
        return `\`\`\`mermaid
flowchart TD
    subgraph Eventos["🎯 Eventos Activadores"]
        A[🏁 Bandera Verde]
        B[⌨️ Tecla Presionada]
        C[🖱️ Clic en Sprite]
        D[📨 Mensaje Recibido]
    end
    
    subgraph Acciones["⚡ Respuestas"]
        E[Mover sprite]
        F[Cambiar disfraz]
        G[Tocar sonido]
        H[Decir mensaje]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    style A fill:#FFD700,color:#000
    style B fill:#FFD700,color:#000
    style C fill:#FFD700,color:#000
    style D fill:#FFD700,color:#000
\`\`\``;
    }

    /**
     * Diagrama de paso de mensajes.
     */
    private _messageDiagram(): string {
        return `\`\`\`mermaid
sequenceDiagram
    participant S1 as 🐱 Sprite 1
    participant E as 📢 Broadcast
    participant S2 as 🦊 Sprite 2
    
    S1->>E: enviar mensaje "saltar"
    E->>S2: al recibir "saltar"
    S2->>S2: ejecutar salto
    S2-->>S1: (continúa independiente)
\`\`\``;
    }

    /**
     * Diagrama de algoritmo/pasos.
     */
    private _algorithmDiagram(): string {
        return `\`\`\`mermaid
flowchart TD
    A[📝 Problema] --> B[🔍 Analizar]
    B --> C[📋 Planificar pasos]
    C --> D[💻 Implementar]
    D --> E[🧪 Probar]
    E --> F{¿Funciona?}
    F -->|No| G[🔧 Depurar]
    G --> D
    F -->|Sí| H[✅ Solución]
    
    style A fill:#E91E63,color:#fff
    style H fill:#4CAF50,color:#fff
\`\`\``;
    }

    /**
     * Diagrama de secuencia simple.
     */
    private _sequenceDiagram(): string {
        return `\`\`\`mermaid
flowchart LR
    A[Paso 1] --> B[Paso 2] --> C[Paso 3] --> D[Paso 4] --> E[Resultado]
    
    style A fill:#2196F3,color:#fff
    style B fill:#03A9F4,color:#fff
    style C fill:#00BCD4,color:#fff
    style D fill:#009688,color:#fff
    style E fill:#4CAF50,color:#fff
\`\`\``;
    }

    /**
     * Diagrama de variables.
     */
    private _variableDiagram(): string {
        return `\`\`\`mermaid
flowchart LR
    subgraph Variable["📦 Variable: puntos"]
        A["🏷️ Nombre: puntos"]
        B["💾 Valor: 100"]
    end
    
    subgraph Operaciones["⚙️ Operaciones"]
        C[fijar puntos a 0]
        D[cambiar puntos por 10]
        E[mostrar puntos]
    end
    
    A --> C
    B --> D
    Variable --> E
    
    style A fill:#FF9800,color:#fff
    style B fill:#4CAF50,color:#fff
\`\`\``;
    }

    /**
     * Diagrama de Entidad-Relación (ER).
     */
    private _erDiagram(): string {
        return `\`\`\`mermaid
erDiagram
    USUARIO ||--o{ POST : "escribe"
    USUARIO {
        string id PK
        string nombre
        string email
    }
    POST {
        string id PK
        string contenido
        datetime fecha
        string autor_id FK
    }
\`\`\``;
    }

    /**
     * Diagrama de Estado.
     */
    private _stateDiagram(): string {
        return `\`\`\`mermaid
stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Activo : login
    Activo --> Inactivo : logout
    Activo --> Procesando : realizar_accion
    Procesando --> Activo : completar
    Procesando --> Error : fallo
    Error --> Inactivo : reset
\`\`\``;
    }

    /**
     * Diagrama genérico para conceptos no predefinidos.
     */
    private _genericConceptDiagram(concept: string): string {
        return `\`\`\`mermaid
mindmap
  root((${concept}))
    Definición
      ¿Qué es?
      ¿Para qué sirve?
    Componentes
      Elemento 1
      Elemento 2
    Ejemplos
      Ejemplo básico
      Ejemplo avanzado
    Relaciones
      Conceptos previos
      Conceptos siguientes
\`\`\``;
    }

    /**
     * Añade un diagrama sugerido al contenido de una lección.
     */
    public enrichLessonWithDiagram(lessonContent: string, concept: string): string {
        const diagram = this.generateForConcept(concept);

        return `${lessonContent}

---

## 📊 Diagrama Visual

El siguiente diagrama ilustra el concepto de forma visual:

${diagram}

*Tip: Los diagramas ayudan a visualizar la estructura y flujo de los conceptos.*`;
    }
}

// Exportar singleton
export const diagramGenerator = new DiagramGenerator();
