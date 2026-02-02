# Checklist de Desarrollo Full-Stack

Este checklist guía el desarrollo de nuevas features end-to-end, desde diseño hasta producción.

---

## Fase 1: Arquitectura y Diseño

### 1.1 Base de Datos
- [ ] Diseñar esquema (tablas, relaciones, índices)
- [ ] Crear migration scripts
- [ ] Definir estrategia de backup
- [ ] Documentar patrones de acceso a datos

### 1.2 API Backend
- [ ] Definir contratos OpenAPI/GraphQL
- [ ] Diseñar autenticación/autorización
- [ ] Planificar rate limiting
- [ ] Establecer patrones de error handling

### 1.3 Frontend
- [ ] Diseñar jerarquía de componentes
- [ ] Definir estado global vs local
- [ ] Planificar rutas
- [ ] Crear wireframes/mockups

---

## Fase 2: Implementación

### 2.1 Backend
- [ ] Implementar endpoints REST/GraphQL
- [ ] Agregar validación con Zod
- [ ] Implementar lógica de negocio
- [ ] Agregar logging estructurado
- [ ] Escribir tests unitarios (>80% coverage)

### 2.2 Frontend
- [ ] Crear componentes React
- [ ] Implementar state management
- [ ] Integrar con API (fetch/axios)
- [ ] Agregar loading states y error handling
- [ ] Implementar responsive design
- [ ] Escribir tests de componentes

### 2.3 Base de Datos
- [ ] Ejecutar migrations
- [ ] Verificar índices y performance
- [ ] Seed data de prueba

---

## Fase 3: Testing y Calidad

### 3.1 Tests
- [ ] Tests unitarios backend (Jest)
- [ ] Tests de integración API
- [ ] Tests E2E (Playwright)
- [ ] Tests de accesibilidad (a11y)

### 3.2 Seguridad
- [ ] Revisar OWASP Top 10
- [ ] Validar sanitización de inputs
- [ ] Verificar headers de seguridad
- [ ] Auditar dependencias (`npm audit`)

### 3.3 Performance
- [ ] Medir Lighthouse score
- [ ] Optimizar bundle size
- [ ] Verificar lazy loading
- [ ] Testear bajo carga

---

## Fase 4: Deployment

### 4.1 CI/CD
- [ ] Pipeline pasa (tests + lint)
- [ ] Build de producción exitoso
- [ ] Environment variables configuradas

### 4.2 Observabilidad
- [ ] Logs configurados
- [ ] Métricas de performance
- [ ] Alertas críticas definidas

### 4.3 Rollout
- [ ] Feature flag (si aplica)
- [ ] Deploy a staging
- [ ] Smoke tests en staging
- [ ] Deploy a producción
- [ ] Monitorear 24h post-deploy

---

## Post-Launch

- [ ] Documentar feature en README/docs
- [ ] Comunicar a stakeholders
- [ ] Recopilar feedback inicial
- [ ] Planificar iteraciones

---

> **Tip**: Copia este checklist a un issue de GitHub para trackear progreso.
