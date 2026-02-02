# Estrategias de Debugging - AI Code Mentor

De frustración a resolución sistemática.

---

## 🔍 Proceso de 5 Pasos

### 1. Reproducir
**Objetivo:** Confirmar que el bug existe y es consistente.
- [ ] ¿Puedo reproducirlo localmente?
- [ ] ¿Es consistente o intermitente?
- [ ] ¿En qué ambiente ocurre?
- [ ] ¿Cuáles son los pasos exactos?

### 2. Aislar
**Objetivo:** Encontrar el código responsable.
- [ ] ¿Cuándo empezó? (bisect con git)
- [ ] ¿Qué componente falla?
- [ ] ¿Qué entrada causa el problema?

### 3. Hipótesis
**Objetivo:** Teorizar la causa raíz.
- [ ] ¿Qué asumí que era verdad?
- [ ] ¿Qué cambió recientemente?
- [ ] ¿Hay patrones similares en otros bugs?

### 4. Verificar
**Objetivo:** Probar la hipótesis.
- [ ] Agregar logs estratégicos
- [ ] Usar debugger para inspeccionar estado
- [ ] Escribir test que falle por el bug

### 5. Resolver
**Objetivo:** Arreglar y prevenir recurrencia.
- [ ] Aplicar fix mínimo necesario
- [ ] Agregar test de regresión
- [ ] Documentar la causa raíz

---

## 🛠️ Herramientas Por Tipo de Bug

### JavaScript/React

| Problema | Herramienta |
|----------|-------------|
| Estado inesperado | React DevTools |
| Renders excesivos | React Profiler |
| Errores de red | Network tab |
| Memory leaks | Memory tab |
| Async bugs | `console.trace()` |

### Node.js/Backend

| Problema | Herramienta |
|----------|-------------|
| Crash sin mensaje | `process.on('uncaughtException')` |
| Queries lentas | Query logging |
| Memory | `--inspect` + Chrome DevTools |
| Async issues | `async_hooks` |

### Comandos Útiles

```bash
# Git bisect para encontrar commit problemático
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# Probar cada commit marcado hasta encontrar el culpable

# Ver cambios recientes en archivo problemático
git log --oneline -10 -- path/to/file.js

# Buscar patrones en logs
grep -r "ERROR" logs/ | sort | uniq -c | sort -rn
```

---

## 🎯 Patrones Comunes y Soluciones

### 1. "Funciona en local, falla en prod"

**Causas típicas:**
- Variables de entorno diferentes
- Versión de Node/dependencias diferente
- Datos de producción vs datos de test
- CORS o configuración de red

**Debugging:**
```bash
# Comparar ambientes
diff <(env | sort) <(ssh prod env | sort)
```

### 2. "Falla intermitentemente"

**Causas típicas:**
- Race conditions
- Timeouts/latencia de red
- Límites de recursos (memoria, conexiones)
- Datos de caché stale

**Debugging:**
- Aumentar logging en área sospechosa
- Buscar patrones en timestamps de logs
- Verificar métricas de recursos

### 3. "No hay mensaje de error"

**Causas típicas:**
- Error silenciado con catch vacío
- Promise sin .catch()
- Error en async sin await

**Debugging:**
```javascript
// Capturar promesas rechazadas globalmente
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection:', reason);
});
```

### 4. "El test pasa, pero la feature falla"

**Causas típicas:**
- Test no cubre el caso real
- Mocks muy permisivos
- Datos de test vs datos reales

**Acción:** Escribir test con datos reales que falle, luego arreglar.

---

## 📝 Template de Bug Report

```markdown
## Descripción
[Qué está pasando vs qué debería pasar]

## Pasos para Reproducir
1. Ir a...
2. Hacer clic en...
3. Ver error...

## Ambiente
- Browser/Node: 
- OS: 
- Commit/Versión: 

## Logs Relevantes
\`\`\`
[Copiar logs aquí]
\`\`\`

## Screenshots
[Si aplica]

## Hipótesis Inicial
[Si tienes una idea de la causa]
```

---

## ⚡ Checklist de Debug Rápido

1. [ ] Leer el mensaje de error completo
2. [ ] Googlear el error exacto
3. [ ] Verificar los últimos cambios (`git diff`)
4. [ ] Verificar logs del servidor
5. [ ] Limpiar cache/rebuild (`npm run build`)
6. [ ] Reproducir con datos mínimos
7. [ ] Pedir segunda opinión si >30 min atorado
