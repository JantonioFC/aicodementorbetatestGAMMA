
# Proceso Kaizen: Mejora Continua

**Filosofía Central**: "Deja el código mejor de lo que lo encontraste."

## 1. La Regla del Boy Scout
Cada Pull Request (PR) debe incluir al menos una pequeña mejora fuera de la funcionalidad principal, ej:
*   Renombrar una variable para mayor claridad.
*   Añadir una definición de tipo faltante.
*   Actualizar un comentario obsoleto.

## 2. Análisis de Causa Raíz (5 Por Qué)
Cuando un bug llega a producción (o bloquea un PR crítico):
1.  **Por Qués**: Pregunta "¿Por qué?" 5 veces para hallar la causa raíz.
2.  **Arreglo**: Aplica la corrección específica.
3.  **Prevención**: Añade un test o regla de linter para evitar recurrencia.

## 3. Retrospectivas (Mensual)
*   **¿Qué salió bien?**
*   **¿Qué fue doloroso?**
*   **Acción**: Elegir UNA mejora de proceso para el próximo mes.

## 4. Documentación Primero
*   Si no puedes explicarlo en el `README.md` o un doc, no lo construyas.
*   Actualiza la documentación *en el mismo PR* que el código.

## 5. Estandarización
Refiérete a `CONTRIBUTING.md` para patrones acordados. Si te desvías, propón un cambio al estándar primero.
