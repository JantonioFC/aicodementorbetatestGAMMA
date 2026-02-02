# Roadmap de Infraestructura

Este documento lista las iniciativas planificadas para evolucionar la plataforma. Los detalles técnicos y estratégicos se encuentran en la documentación interna.

## Próximos Pasos (Q3-Q4)

### 🔭 Observabilidad
- Implementación de stack completo de monitoreo (Prometheus/Grafana) para visualizar métricas de negocio y sistema expuestas por `/api/metrics`.

### 🔄 Automatización (GitOps)
- Evolución de los scripts de CI actuales hacia un flujo GitOps completo.
- Automatización total del ciclo de vida de despliegue mediante GitHub Actions/ArgoCD.

### ⚡ Escalabilidad Serverless
- Refactorización de componentes intensivos (Generación de Reportes, IA) hacia arquitectura Serverless dedicada para mejorar performance y costos.

---
*Nota: Para detalles de implementación, referirse a la documentación privada de arquitectura.*
