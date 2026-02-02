# Optimización de Contexto para IA - AI Code Mentor

Estrategias para maximizar la eficiencia del contexto con modelos de lenguaje.

---

## 📊 Problema

El contexto de los LLMs es limitado. Cuando el contexto se llena:
- La calidad de respuestas degrada
- El costo por token aumenta
- La latencia incrementa

**Objetivo:** Doblar o triplicar la capacidad efectiva del contexto.

---

## 🔧 4 Estrategias Principales

### 1. Compactación

Resumir contexto cuando se acerca al límite.

**Prioridad de compresión:**
1. Outputs de herramientas → Resumir
2. Turnos antiguos → Sintetizar
3. Documentos recuperados → Extraer puntos clave
4. System prompt → NUNCA comprimir

```javascript
// Trigger de compactación
if (contextTokens / contextLimit > 0.8) {
  context = compactContext(context);
}
```

### 2. Enmascaramiento de Observaciones

Reemplazar outputs verbosos con referencias.

```javascript
// Antes
{
  role: "tool",
  content: "... 5000 tokens de output de búsqueda ..."
}

// Después
{
  role: "tool",
  content: "[Obs:ref-123 resumido. Key: 15 archivos encontrados, 3 relevantes]"
}
```

**Cuándo enmascarar:**
- Outputs de >3 turnos atrás
- Outputs cuyo propósito ya se cumplió
- Headers/footers repetitivos

**NUNCA enmascarar:**
- Observaciones del turno actual
- Información crítica para la tarea
- Datos en razonamiento activo

### 3. Optimización de KV-Cache

Ordenar contenido para maximizar hits de cache.

```javascript
// Orden óptimo
const context = [
  systemPrompt,        // Más estable, primero
  toolDefinitions,     // Estable
  reusedTemplates,     // Semi-estable
  uniqueContent        // Único, último
];
```

**Tips:**
- Evitar timestamps dinámicos en prompts
- Mantener formato consistente
- Estructura estable entre sesiones

### 4. Particionamiento de Contexto

Dividir trabajo entre sub-agentes con contextos aislados.

```
┌─────────────────────────────────────────┐
│           Agente Coordinador            │
│     (contexto limpio, síntesis)         │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌───────┐    ┌───────┐    ┌───────┐
│ Sub-1 │    │ Sub-2 │    │ Sub-3 │
│ Buscar│    │Analizar│   │Generar│
└───────┘    └───────┘    └───────┘
```

---

## 📏 Gestión de Presupuesto

### Distribución Recomendada

| Componente | % del Contexto |
|------------|----------------|
| System Prompt | 5-10% |
| Tool Definitions | 5-10% |
| Documentos/RAG | 20-30% |
| Historial de Mensajes | 30-40% |
| Buffer Reservado | 15-20% |

### Triggers de Optimización

| Señal | Acción |
|-------|--------|
| Uso >70% | Activar monitoreo |
| Uso >80% | Iniciar compactación |
| Calidad degradando | Revisar qué sobra |

---

## 🎯 Cuándo Aplicar Qué

| Problema | Estrategia |
|----------|------------|
| Outputs de tools dominan | Enmascaramiento |
| Docs recuperados dominan | Particionamiento |
| Historial muy largo | Compactación |
| Múltiples componentes | Combinar |

---

## 📈 Métricas de Éxito

| Técnica | Reducción Esperada | Degradación Máx |
|---------|--------------------|-----------------| 
| Compactación | 50-70% | <5% |
| Enmascaramiento | 60-80% | <3% |
| Cache | 70%+ hit rate | 0% |

---

## 💡 Quick Wins para Este Proyecto

1. **Prompts modulares:** Cargar solo instrucciones relevantes
2. **Historial rotativo:** Mantener solo últimos N turnos
3. **Resumir lecciones:** Comprimir contenido de lecciones generadas
4. **Cache de templates:** Reutilizar templates comunes
