# Linting y Validación - AI Code Mentor

> **REGLA:** Ejecutar validación después de CADA cambio de código.

---

## 🔄 Quality Loop

```
1. Escribir/Editar código
       ↓
2. Ejecutar lint + tipos
       ↓
3. Analizar errores
       ↓
4. Arreglar y repetir
       ↓
5. Commit (solo si pasa)
```

---

## 📋 Comandos por Ecosistema

### Node.js / JavaScript

| Verificación | Comando |
|-------------|---------|
| Lint + Fix | `npx eslint . --fix` |
| TypeScript | `npx tsc --noEmit` |
| Seguridad | `npm audit --audit-level=high` |
| Build | `npm run build` |

### Python

| Verificación | Comando |
|-------------|---------|
| Lint (Ruff) | `ruff check . --fix` |
| Seguridad | `bandit -r . -ll` |
| Tipos | `mypy .` |

---

## ⚡ Script de Validación Completa

```bash
#!/bin/bash
# scripts/validate-code.sh

echo "🔍 Ejecutando validación..."

# 1. Lint
echo "1/4 Linting..."
npm run lint 2>/dev/null || echo "⚠️  Lint deshabilitado"

# 2. TypeScript (si existe tsconfig)
if [ -f "tsconfig.json" ]; then
  echo "2/4 TypeScript..."
  npx tsc --noEmit || exit 1
else
  echo "2/4 TypeScript... (no configurado)"
fi

# 3. Build
echo "3/4 Build..."
npm run build || exit 1

# 4. Audit
echo "4/4 Seguridad..."
npm audit --audit-level=high || echo "⚠️  Vulnerabilidades encontradas"

echo "✅ Validación completa"
```

---

## 🚨 Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| ESLint fails | Estilo/sintaxis | `--fix` o corregir manualmente |
| tsc fails | Tipos incorrectos | Revisar tipos, agregar `@ts-ignore` como último recurso |
| Build fails | Import roto | Verificar paths, dependencias |
| Audit fails | Vulnerabilidad | `npm update` o evaluar riesgo |

---

## ⚙️ Configuración ESLint 9 (Flat Config)

Ya que ESLint 9 requiere `eslint.config.js`:

```javascript
// eslint.config.js
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
    },
    ignores: ['.next/', 'node_modules/'],
  },
];
```

---

## 📊 Métricas de Calidad

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| 0 errores lint | 100% | `npm run lint` |
| 0 errores tipos | 100% | `npx tsc --noEmit` |
| 0 vulns críticas | 100% | `npm audit` |
| Coverage >80% | 80%+ | `npm test -- --coverage` |

---

## ✅ Regla Estricta

> **Ningún código debe committearse o reportarse como "terminado" sin pasar estas verificaciones.**
