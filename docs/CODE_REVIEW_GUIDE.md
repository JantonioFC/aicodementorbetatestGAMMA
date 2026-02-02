# Guía de Code Review - AI Code Mentor

Transformar code reviews de gatekeeping a compartir conocimiento.

---

## 📋 Checklist Rápido

### Antes de Aprobar

- [ ] **Correctitud**: ¿Hace lo que debe hacer?
- [ ] **Tests**: ¿Hay tests? ¿Cubren edge cases?
- [ ] **Seguridad**: ¿Hay inputs sin sanitizar? ¿Datos expuestos?
- [ ] **Performance**: ¿Hay loops innecesarios? ¿N+1 queries?
- [ ] **Mantenibilidad**: ¿Se entiende el código en 6 meses?

---

## 🚦 Severidad de Comentarios

| Nivel | Prefijo | Significado |
|-------|---------|-------------|
| Bloqueante | `🔴 BLOCKING:` | Debe arreglarse antes de merge |
| Importante | `🟡 IMPORTANT:` | Debería arreglarse, pero no bloquea |
| Sugerencia | `💡 SUGGESTION:` | Mejora opcional |
| Pregunta | `❓ QUESTION:` | Necesito entender la decisión |
| Nitpick | `🔍 NIT:` | Estilo menor, ignorar si hay prisa |

---

## ✅ Formato de Feedback

### Template de Comentario

```markdown
**[SEVERIDAD]** Breve descripción

**Por qué importa:** [Impacto si no se arregla]  
**Sugerencia:** [Código o acción concreta]  
**Alternativa:** [Si aplica, otra opción válida]
```

### Ejemplo Real

```markdown
🟡 IMPORTANT: SQL injection potencial

La query usa interpolación directa:
`db.query(\`SELECT * FROM users WHERE id = ${userId}\`)`

**Por qué importa:** Un atacante podría inyectar SQL malicioso.
**Sugerencia:** Usar prepared statements:
\`\`\`js
db.query('SELECT * FROM users WHERE id = ?', [userId])
\`\`\`
```

---

## 🎯 Qué Revisar Por Área

### Backend/API
- [ ] Autenticación y autorización correctas
- [ ] Validación de inputs
- [ ] Manejo de errores (no exponer stack traces)
- [ ] Rate limiting si es endpoint público
- [ ] Logging apropiado

### Frontend/React
- [ ] Keys únicas en listas
- [ ] Cleanup en useEffect
- [ ] Memoización donde aplica
- [ ] Accesibilidad (alt, aria-labels)
- [ ] Estados de loading y error

### Base de Datos
- [ ] Índices para queries frecuentes
- [ ] Migraciones reversibles
- [ ] No queries N+1
- [ ] Transacciones donde corresponde

---

## 💬 Tono y Comunicación

### ✅ Hacer
- "¿Qué te parece si...?" en lugar de "Debes..."
- Explicar el POR QUÉ, no solo el QUÉ
- Reconocer lo bueno: "Me gusta cómo manejaste X"
- Ofrecer alternativas, no solo críticas
- Usar "nosotros" para decisiones de equipo

### ❌ Evitar
- "Esto está mal" sin contexto
- "¿Por qué hiciste esto?" (suena acusatorio)
- Más de 20 comentarios en un PR (agrupar)
- Comentarios sobre estilo si hay linter
- Reescribir todo el PR en comentarios

---

## ⏱️ Tiempos de Review

| Tamaño PR | Líneas | Tiempo Review |
|-----------|--------|---------------|
| XS | <50 | <15 min |
| S | 50-200 | 15-30 min |
| M | 200-500 | 30-60 min |
| L | 500+ | Pedir split |

> **Regla**: PRs de más de 500 líneas deben dividirse en PRs más pequeños.

---

## 🔄 Flujo de Aprobación

```
PR Creado
    │
    ▼
Review (usar checklist)
    │
    ├── Sin comentarios → Aprobar ✅
    │
    └── Con comentarios → Request Changes
            │
            ▼
        Autor corrige
            │
            ▼
        Re-review (solo cambios)
            │
            ▼
        Aprobar ✅
```
