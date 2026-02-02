# Programa de Referidos - AI Code Mentor

Convertir usuarios en motor de crecimiento.

---

## 🎯 Estructura del Programa

### Incentivo Double-Sided

| Quien Refiere | Quien es Referido |
|---------------|-------------------|
| 1 mes Pro gratis | 14 días Pro gratis |

**Mecánica:**
1. Usuario comparte link único
2. Amigo se registra y activa cuenta
3. Ambos reciben beneficio automáticamente

---

## 📊 Métricas Clave

### Viral Coefficient (K)
```
K = Invitaciones promedio × Tasa de conversión

Ejemplo:
- 3 invitaciones promedio × 15% conversión = 0.45
- K > 1 = Crecimiento viral
- K < 1 = Amplificación (sigue sumando)
```

### Benchmarks

| Métrica | Objetivo |
|---------|----------|
| % usuarios que refieren | 15-25% |
| Referidos por referidor | 2-3 |
| Conversión de invitación | 10-20% |
| LTV referidos vs normal | +20% |

---

## 🚀 Momentos de Activación

### Cuándo Pedir Referido

| Momento | Efectividad |
|---------|-------------|
| Después de completar lección | ⭐⭐⭐⭐⭐ |
| Después de logro/badge | ⭐⭐⭐⭐ |
| Al renovar suscripción | ⭐⭐⭐⭐ |
| Después de soporte excelente | ⭐⭐⭐⭐⭐ |
| Random en dashboard | ⭐ |

---

## 💌 Secuencia de Emails

### Email 1: Lanzamiento
```
Asunto: Gana 1 mes Pro gratis compartiendo AI Code Mentor

Ahora puedes ganar 1 mes Pro por cada amigo que se una.
Ellos también reciben 14 días Pro gratis.

[Tu link único: aicodementor.com/ref/abc123]

Cómo funciona:
1. Comparte tu link
2. Tu amigo se registra
3. Ambos ganan 🎉
```

### Email 2: Recordatorio (7 días después)
```
Asunto: ¿Conoces a alguien que quiera aprender a programar?

Hey {nombre},

Ya llevas {X} lecciones completadas. 
¿Tienes amigos que también quieran aprender?

Comparte tu link y ambos ganan.
```

### Email 3: Post-logro
```
Asunto: 🎉 ¡Completaste {módulo}! Comparte tu logro

Felicidades por completar {módulo}.

¿Por qué no inspiras a un amigo a empezar también?
Ambos ganan cuando se unan.
```

---

## 🛡️ Prevención de Fraude

### Medidas Técnicas
- [ ] Email verification requerido
- [ ] Acción mínima antes de reward (completar 1 lección)
- [ ] Límite de referidos por período (10/mes)
- [ ] Device fingerprinting básico

### Políticas
- [ ] Reward en crédito de producto (no cash)
- [ ] Clawback si hay refund
- [ ] Review manual para patrones sospechosos

---

## 📋 Checklist de Implementación

### Fase 1: MVP
- [ ] Generar links únicos por usuario
- [ ] Tracking de referidos con atribución
- [ ] Aplicar beneficios automáticamente
- [ ] Email de notificación de reward

### Fase 2: Optimización
- [ ] A/B test de incentivos
- [ ] Dashboard de referidos para usuario
- [ ] Gamificación (tiers de referidor)
- [ ] Integración con onboarding

### Fase 3: Escala
- [ ] Programa de afiliados (creadores)
- [ ] Comisiones recurrentes
- [ ] Materiales para compartir

---

## 🔧 Implementación Técnica

### Schema DB
```sql
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_id TEXT,
  referral_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT NOW,
  converted_at DATETIME,
  reward_applied_at DATETIME
);
```

### API Endpoints
```
GET  /api/referral/code     → Obtener código del usuario
POST /api/referral/apply    → Aplicar código al registrarse
GET  /api/referral/stats    → Dashboard de referidos
```

---

## 📈 ROI Esperado

```
Costo por referido exitoso = Valor del reward
                           = 1 mes Pro ($X)

LTV promedio referido      = LTV normal × 1.2
CAC via referido          = $X (el reward)

Si CAC normal = $50 y reward = $20
→ Ahorro de $30 por adquisición
→ ROI = 150%
```
