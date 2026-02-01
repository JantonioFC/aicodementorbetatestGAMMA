# 🎓 AI Code Mentor - Ecosistema 360 | Plataforma Educativa Completa

## 📋 Descripción

**AI Code Mentor - Ecosistema 360** es una plataforma completa de aprendizaje autogestionado que implementa la metodología educativa **Ecosistema 360** con **Simbiosis Crítica Humano-IA**. 

Combina un currículo estructurado de 24 meses (8 fases: F0-F7) con herramientas profesionales de gestión de portfolio, plantillas educativas y analíticas de progreso avanzadas.

## 🏗️ Arquitectura Actual: v20.0 - Local First / SQLite Edition

**Sistema Operacional:** Plataforma educativa completa basada en **Next.js Monolith** con **SQLite Local**, **Autenticación Nativa (JWT)**, **Router IA Resiliente**, **Soporte Multi-Dominio** y **Sistema de Plugins**.

### Características Principales:
- ✅ **Local-First Architecture:** Eliminación total de dependencias externas críticas (Supabase). 🆕
- ✅ **SQLite Backend:** Base de datos relacional local de alto rendimiento (`lib/db.js`). 🆕
- ✅ **Autenticación Nativa:** Sistema de JWT seguro sin proveedores externos. 🆕
- ✅ **Currículo Completo:** 100 semanas, 8 fases, múltiples módulos estructurados
- ✅ **Soporte Multi-Dominio:** Programación, Lógica, Bases de Datos, Matemáticas
- ✅ **Sandbox Contextual:** Historial y preferencias persistentes en BD local
- ✅ **API Counter Local:** Tracking preciso de uso de IA
- ✅ **Sistema de Plugins:** Arquitectura extensible con PluginManager
- ✅ **API Estable v2.1:** API Routes Integradas (v1 legacy + v2 resiliente)
- ✅ **Serverless Ready:** Arquitectura de puerto único (3000)
- ✅ **Router IA Resiliente v19.1:** Fallback automático Gemini Pro → Flash
- ✅ **Auto-Discovery de Modelos:** Detección automática de modelos Google AI
- ✅ **Sistema IRP Integrado v20.0:** Revisión por Pares (IA) local

### Stack Tecnológico (v20.0):
- **Frontend:** Next.js 15+ + React 18 + TailwindCSS
- **Backend:** Next.js API Routes (Serverless Functions)
- **Base de Datos:**
  - **SQLite (better-sqlite3):** Base de datos unificada (Usuarios, Progreso, IRP, Currículo)
  - **IndexedDB (Cliente):** Historial de análisis, borradores
- **Autenticación:** JWT (Local Implementation)
- **Testing:** Jest + Playwright E2E Integration Suite
- **IA Integration:** Gemini 1.5 Pro/Flash (via Router Resiliente)
- **Extensibilidad:** Sistema de Plugins (IPlugin + PluginManager)

## 🚀 Instalación y Configuración

### Prerrequisitos:
- Node.js 18+ instalado
- API key de Gemini (Google AI Studio)

### Pasos de Instalación:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/ai-code-mentor-v5.git
cd ai-code-mentor-v5
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno (.env.local):**
```bash
cp .env.example .env.local
```

Configura las variables esenciales:
```bash
# AI Services
GEMINI_API_KEY=tu-gemini-api-key

# Auth & Security
JWT_SECRET=tu-secreto-local-aleatorio
```

4. **Inicialización Automática:**
   - La base de datos SQLite se inicializa automáticamente al arrancar el servidor.
   - Se crea/restaura el esquema y los datos iniciales.

5. **Iniciar el ecosistema:**
```bash
npm run dev
```

> **🔧 Auto-Setup:** Al ejecutar `npm run dev`, el sistema automáticamente:
> - ✅ Inicializa `curriculum.db` (SQLite)
> - ✅ Aplica migraciones necesarias
> - ✅ Crea el usuario demo (`demo@aicodementor.com` / `demo123`)

6. **Verificar instalación:**
   - Abre `http://localhost:3000`
   - Login: `demo@aicodementor.com` / `demo123`
   - Health Check IA: `http://localhost:3000/api/v2/health`

## 🧪 Testing y Validación (Actualizado v20.0)

### Testing E2E:
Validación completa de integración UI + API + Auth Local.

```bash
# Ejecutar suite completa
npx playwright test
```

### Script de Verificación Pre-Test:
```bash
node e2e/verify-setup.js
```

## 🎯 Funcionalidades Implementadas

### ✅ **Local-First Core (v20.0)** 🆕
- **Eliminación de Supabase:** Migración completa a SQLite (`better-sqlite3`).
- **Autenticación Local:** Control total de sesiones y usuarios sin terceros.
- **Rendimiento Mejorado:** Latencia cero en consultas a base de datos.
- **Privacidad:** Datos sensibles almacenados localmente.

### ✅ **Router IA Resiliente (v19.1)**
- **Fallback Automático:** Gemini Pro → Flash → Error con reintentos
- **Auto-Discovery:** Detecta modelos disponibles via Google AI API
- **Cache Inteligente:** Respuestas cacheadas 1 hora
- **Prompts Dinámicos:** Personalizados por fase del estudiante (F0-F7)
- **API v2:** Nuevos endpoints resilientes (`/api/v2/analyze`, `/api/v2/health`)

### ✅ **Persistencia Cliente (v19.1)**
- **IndexedDB:** Almacenamiento de historial de análisis
- **Borradores Auto-guardados:** Nunca pierdas tu código
- **Backups:** Sistema de respaldo automático semanal

### ✅ **Soporte Multi-Dominio (v19.2)**
- **Dominios:** Programación, Lógica, Bases de Datos, Matemáticas
- **Selector UI:** Dropdown en Sandbox
- **Persistencia:** BD Local para preferencia de dominio
- **Constraints Dinámicos:** Restricciones pedagógicas por nivel

### ✅ **Sistema de Plugins (v19.2)**
- **Interfaz IPlugin:** Contrato estándar para extensiones
- **PluginManager:** Registro, ciclo de vida, dependencias
- **Pipeline:** preProcess → analyze → postProcess

### ✅ **Sistema IRP Integrado (v20.0)**
- **Arquitectura:** Módulo interno. Datos en SQLite.
- **IA Reviewer:** Motor de revisión automática con Gemini 1.5.
- **API Unificada:** Endpoints estandarizados en `/api/v1/irp/*`.

### ✅ **Dashboard de Progreso del Estudiante**
- Visualización multidimensional del progreso.
- Métricas de competencias y habilidades.
- Analytics avanzados con gráficos interactivos.

### ✅ **Sistema de Logros Gamificados** Framework de logros y badges automáticos.
### ✅ **Sandbox de Experimentación:** Entorno seguro para pruebas de código.

## 📊 Currículo Ecosistema 360 (24 Meses)

(Estructura curricular completa mantenida de v18.0)
- **Fase 0:** Cimentación (Pre-start)
- **Fase 1:** Fundamentos de Programación (6 meses)
- **Fase 2:** Frontend Básico (4 meses)
- **Fase 3:** Frontend Interactivo (5 meses)
- **Fase 4:** Backend Profesional (4 meses)
- **Fase 5:** DevOps y Cloud (4 meses)
- **Fase 6:** Especialización IA/Data (2 meses)
- **Fase 7:** Proyecto Integrador

## 🔧 Troubleshooting

### **Error: "Auth session missing" en Tests**
- Asegúrate de usar los utilitarios de mock auth o el token de prueba E2E configurado.

### **Error: "Tablas no encontradas"**
- Verifica que hayas ejecutado `supabase/migrations/irp_migration.sql`.

## 📝 Licencia y Contribuciones

### **Licencia:** MIT

### **Contribuciones:**
Las contribuciones son bienvenidas siguiendo el **[CONTRIBUTING.md](CONTRIBUTING.md)**. Priorizamos la simplicidad (KISS) y la estabilidad.

## 🧪 Beta Testing - ¡Tu Feedback es Importante!

Este proyecto está en **beta pública**. Agradecemos tu ayuda para mejorarlo:

| Tipo | Cómo Reportar |
|------|---------------|
| 🐛 **Bugs** | [Crear Issue](https://github.com/JantonioFC/ai-code-mentor-beta-test/issues/new?template=bug_report.md) |
| 💡 **Mejoras** | [Sugerir Feature](https://github.com/JantonioFC/ai-code-mentor-beta-test/issues/new?template=feature_request.md) |
| ❓ **Preguntas** | [Hacer Pregunta](https://github.com/JantonioFC/ai-code-mentor-beta-test/issues/new?template=question.md) |

---

**Última actualización:** Enero 31, 2026  
**Versión:** v20.0-rc  
**Estado:** ✅ **RELEASE CANDIDATE** - Migración a SQLite completa
