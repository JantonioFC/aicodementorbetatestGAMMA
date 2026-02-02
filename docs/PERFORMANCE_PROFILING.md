# Profiling de Rendimiento - AI Code Mentor

> Medir → Analizar → Optimizar (en ese orden)

---

## 🎯 Core Web Vitals

| Métrica | Bueno | Malo | Mide |
|---------|-------|------|------|
| **LCP** | <2.5s | >4.0s | Loading |
| **INP** | <200ms | >500ms | Interactividad |
| **CLS** | <0.1 | >0.25 | Estabilidad |

---

## 🔧 Proceso de 4 Pasos

```
1. BASELINE → Medir estado actual
       ↓
2. IDENTIFY → Encontrar cuello de botella
       ↓
3. FIX → Cambio específico
       ↓
4. VALIDATE → Confirmar mejora
```

---

## 🛠️ Herramientas por Problema

| Problema | Herramienta |
|----------|-------------|
| Carga de página | Lighthouse |
| Tamaño de bundle | Bundle Analyzer |
| Runtime | DevTools Performance |
| Memoria | DevTools Memory |
| Red | DevTools Network |

### Comandos Útiles

```bash
# Lighthouse local
npx lighthouse http://localhost:3000 --view

# Bundle analyzer (Next.js)
ANALYZE=true npm run build

# Coverage de código
npm test -- --coverage
```

---

## 📦 Análisis de Bundle

### Qué Buscar

| Problema | Indicador |
|----------|-----------|
| Deps grandes | Top del bundle |
| Código duplicado | Múltiples chunks |
| Código no usado | Baja cobertura |
| Sin splitting | Un chunk gigante |

### Acciones

| Hallazgo | Acción |
|----------|--------|
| Librería grande | Importar módulos específicos |
| Deps duplicadas | Dedupe, actualizar |
| Ruta en main | Code split |
| Exports no usados | Tree shake |

---

## ⚡ Runtime Profiling

### Performance Tab

| Patrón | Significado |
|--------|-------------|
| Long tasks (>50ms) | Bloqueo de UI |
| Muchas tareas pequeñas | Oportunidad de batch |
| Layout/paint | Cuello en rendering |
| Script largo | JS pesado |

### Memory Tab

| Patrón | Significado |
|--------|-------------|
| Heap creciendo | Posible leak |
| Retención grande | Revisar referencias |
| DOM detached | No limpiado |

---

## 🐛 Por Síntoma

| Síntoma | Causa Probable |
|---------|----------------|
| Carga lenta | JS grande, render blocking |
| Interacciones lentas | Event handlers pesados |
| Scroll con jank | Layout thrashing |
| Memoria creciendo | Leaks, refs retenidas |

---

## ⚡ Quick Wins

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| 1 | Habilitar compresión | Alto |
| 2 | Lazy load imágenes | Alto |
| 3 | Code split rutas | Alto |
| 4 | Cache assets | Medio |
| 5 | Optimizar imágenes | Medio |

---

## ❌ Anti-Patrones

| No Hacer | Hacer |
|----------|-------|
| Adivinar | Perfilar primero |
| Micro-optimizar | Arreglar lo más grande |
| Optimizar temprano | Optimizar cuando necesario |
| Ignorar usuarios reales | Usar RUM |

---

## 📊 Este Proyecto

### Ya Implementado ✅
- Bundle analyzer (`ANALYZE=true`)
- Image optimization (AVIF/WebP)
- Static asset caching
- Dynamic imports (PerformanceMonitor)

### Próximos Pasos
- [ ] Implementar RUM (Real User Monitoring)
- [ ] Configurar Lighthouse CI
- [ ] Code split páginas grandes

---

> **Recuerda:** El código más rápido es el que no se ejecuta. Elimina antes de optimizar.
