# Plantilla de Lección - AI Code Mentor

Estructura estándar para todas las lecciones generadas por IA.

---

## 🎯 Apertura (30 segundos)

```markdown
## ¿Qué Aprenderás?

- [ ] **Objetivo 1**: [Descripción concreta]
- [ ] **Objetivo 2**: [Descripción concreta]

⏱️ **Tiempo estimado:** 15-20 minutos
📊 **Nivel:** [Principiante/Intermedio/Avanzado]
🔗 **Prerrequisitos:** [Lista o "Ninguno"]
```

---

## 📚 Concepto (2-3 minutos)

### Estructura

1. **Analogía del mundo real**
   - Conectar con algo que el estudiante ya conoce
   - Ejemplo: "Piensa en una función como una receta de cocina..."

2. **Definición técnica**
   - Explicación formal pero accesible
   - Vocabulario clave resaltado en **negrita**

3. **¿Por qué importa?**
   - Aplicaciones prácticas
   - Problemas que resuelve

### Ejemplo de Concepto

```markdown
## ¿Qué es una Función?

🍳 **Analogía:** Una función es como una receta. Le das ingredientes (parámetros), 
sigue unos pasos (código), y obtienes un plato (resultado).

**Definición:** Una **función** es un bloque de código reutilizable que realiza 
una tarea específica. Recibe **parámetros** de entrada y puede devolver un **resultado**.

**¿Por qué importa?** Sin funciones, tendrías que escribir el mismo código 
una y otra vez. Con funciones, escribes una vez y usas muchas veces.
```

---

## 💻 Ejemplo Mínimo (3-5 minutos)

### Reglas

- Código ejecutable y completo
- Máximo 15-20 líneas
- Comentarios en líneas clave
- Output esperado incluido

### Formato

```markdown
## Ejemplo Práctico

\`\`\`python
# Definimos una función que saluda
def saludar(nombre):
    """Retorna un saludo personalizado."""
    return f"¡Hola, {nombre}!"

# Usamos la función
mensaje = saludar("María")
print(mensaje)
\`\`\`

**Output esperado:**
\`\`\`
¡Hola, María!
\`\`\`
```

---

## 🛠️ Práctica Guiada (5-7 minutos)

### Formato Step-by-Step

```markdown
## Vamos a Construir Juntos

### Paso 1: Crear el archivo
Crea un nuevo archivo llamado `calculadora.py`.

### Paso 2: Definir la función
\`\`\`python
def sumar(a, b):
    return a + b
\`\`\`

**¿Qué hace cada línea?**
- `def sumar(a, b):` → Define la función con dos parámetros
- `return a + b` → Devuelve la suma de los parámetros

### Paso 3: Probar la función
\`\`\`python
resultado = sumar(5, 3)
print(resultado)  # Debería imprimir: 8
\`\`\`

✅ **Checkpoint:** Si ves `8` en la consola, ¡vas bien!
```

---

## 🎯 Ejercicio (5-10 minutos)

### Estructura

```markdown
## Tu Turno

### Desafío
Crea una función llamada `calcular_area_rectangulo` que:
- Reciba `base` y `altura` como parámetros
- Retorne el área (base × altura)

### Pistas (si te atascas)
<details>
<summary>💡 Pista 1</summary>
La fórmula del área de un rectángulo es: base × altura
</details>

<details>
<summary>💡 Pista 2</summary>
Usa `return base * altura` para devolver el resultado
</details>

### Solución
<details>
<summary>Ver solución completa</summary>

\`\`\`python
def calcular_area_rectangulo(base, altura):
    return base * altura

# Prueba
print(calcular_area_rectangulo(5, 3))  # 15
\`\`\`
</details>
```

---

## ⚠️ Errores Comunes (1-2 minutos)

```markdown
## Troubleshooting

### Error: `NameError: name 'mi_funcion' is not defined`
**Causa:** Intentaste usar la función antes de definirla.
**Solución:** Asegúrate de que `def mi_funcion():` aparezca antes de llamarla.

### Error: `TypeError: missing 1 required positional argument`
**Causa:** Llamaste la función sin todos los parámetros necesarios.
**Solución:** Verifica cuántos parámetros pide la función y pásalos todos.

### Error: La función no devuelve nada
**Causa:** Olvidaste el `return`.
**Solución:** Agrega `return resultado` al final de la función.
```

---

## 📋 Resumen (30 segundos)

```markdown
## Lo que Aprendiste

✅ Las funciones son bloques de código reutilizables
✅ Se definen con `def nombre(parámetros):`
✅ Usan `return` para devolver resultados
✅ Se pueden llamar múltiples veces con diferentes argumentos

## Próximos Pasos

1. **Practica más:** Crea 3 funciones propias
2. **Siguiente lección:** Parámetros por defecto y *args
3. **Proyecto sugerido:** Calculadora con múltiples operaciones
```

---

## 🔧 Metadatos de Lección (YAML)

```yaml
lesson:
  id: "lesson-001"
  title: "Introducción a Funciones"
  topic: "functions"
  language: "python"
  difficulty: "beginner"
  estimated_time_minutes: 20
  prerequisites: ["variables", "tipos-de-datos"]
  learning_objectives:
    - "Definir funciones con def"
    - "Usar parámetros y argumentos"
    - "Retornar valores con return"
  tags: ["python", "funciones", "fundamentos"]
```
