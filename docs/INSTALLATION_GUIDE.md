# ⚙️ GUÍA DE INSTALACIÓN TÉCNICA - AI CODE MENTOR

**Versión:** 20.0 (Local First / SQLite Edition)
**Stack:** Next.js Monolith + SQLite + Google Gemini AI
**Entorno:** Local Development (Windows/Linux/Mac)

---

## 📋 REQUISITOS DEL SISTEMA

### **Software Base:**
- **Node.js:** v18.17.0 o superior (LTS recomendado).
- **Git:** Para control de versiones.
- **Navegador:** Chrome/Edge/Firefox actualizado (para soporte de Features modernas).

### **Servicios Externos (Gratuitos):**
1. **Google AI Studio:** Para obtener la `GEMINI_API_KEY`.
   - [Conseguir API Key](https://aistudio.google.com/)

---

## 🚀 PASO A PASO: INSTALACIÓN DESDE CERO

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/ai-code-mentor-v5.git
cd ai-code-mentor-v5
```

### 2. Instalar Dependencias

Utilizamos `npm` para gestionar las dependencias del monorepo unificado.

```bash
npm install
```

### 3. Configuración de Variables de Entorno

El sistema necesita credenciales para funcionar. Crea un archivo `.env.local` en la raíz:

```bash
# Copiar plantilla base
cp .env.example .env.local
```

**Edita `.env.local` con tus credenciales reales:**

```env
# --- GOOGLE AI (Inteligencia Artificial) ---
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL_NAME="gemini-2.5-flash" (Opcional, default: gemini-2.5-flash)

# --- SEGURIDAD ---
JWT_SECRET="tu-secreto-local-aleatorio-para-tokens"
```

### 4. Inicialización de Base de Datos

**¡Automático!** 
No necesitas ejecutar scripts SQL manualmente ni configurar bases de datos externas.
Al arrancar el servidor en modo desarrollo (`npm run dev`), el sistema:

1. Verifica la existencia de `lib/db/curriculum.db` (SQLite).
2. Si no existe, la crea e inicializa con el esquema y datos semilla.
3. Asegura que el usuario demo exista.

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

- El servidor iniciará en: `http://localhost:3000`
- **Health Check:** Visita `http://localhost:3000/api/v2/health` para verificar que la IA responde.

---

## 🧪 VERIFICACIÓN DE INSTALACIÓN

Una vez corriendo, realiza estas pruebas para confirmar que todo funciona:

| Prueba | Acción | Resultado Esperado |
|--------|--------|-------------------|
| **Front** | Abrir `http://localhost:3000` | Carga Landing Page sin errores. |
| **Auth** | Ir a `/login` con `demo@aicodementor.com` / `demo123` | Redirige al Panel de Control. |
| **IA** | Ir a `/codigo` (Sandbox) | Genera una lección al enviar texto. |
| **DB** | Guardar lección en Sandbox | Aparece en el Historial (derecha). |

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error: "API Key inválida" en Sandbox**
- Verifica que `GEMINI_API_KEY` en `.env.local` sea correcta.
- Asegúrate de haber reiniciado el servidor (`Ctrl+C` -> `npm run dev`) tras cambiar el .env.

### **Error: "Auth session missing" (401)**
- Limpia las cookies del navegador (especialmente `token`).
- Intenta hacer login nuevamente.

### **Error: Dependencias de "microservicio-irp"**
- **Solución:** La arquitectura actual es monolítica. Si ves referencias a carpetas antiguas, ignóralas. Todo corre desde la raíz.

---

## 📚 RECURSOS ADICIONALES

- [Arquitectura Viva (Técnica)](../docs/architecture/ARQUITECTURA_VIVA_v20.0.md)
- [Guía de Sandbox](../docs/USER_GUIDE_SANDBOX.md)

