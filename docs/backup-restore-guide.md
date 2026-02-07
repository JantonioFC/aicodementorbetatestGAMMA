# 🛡️ Guía de Respaldos (Backup & Restore)

AI Code Mentor cuenta con un sistema de respaldos automáticos para la base de datos SQLite y los logs del sistema.

## 🗄️ Base de Datos (SQLite)

La base de datos se encuentra en `database/sqlite/curriculum.db`.

### Respaldos Automáticos
- **Setup Preventivo**: Cada vez que ejecutas `npm run dev`, el sistema crea un respaldo automático en `database/backups/` antes de realizar cualquier operación de mantenimiento.
- **Rotación**: El sistema mantiene solo los últimos **7 respaldos** para optimizar el espacio en disco.

### Respaldos Manuales
Puedes disparar un respaldo en cualquier momento ejecutando:
```bash
npm run db:backup
```
Los archivos se guardan como `.zip` comprimidos.

### Restauración Manual
Para restaurar la base de datos desde un respaldo:
1. Detén el servidor (`Ctrl+C`).
2. Localiza el archivo `.zip` deseado en `database/backups/`.
3. Descomprime el archivo (obtendrás un `curriculum.db`).
4. Reemplaza `database/sqlite/curriculum.db` con el archivo restaurado.
5. Inicia el servidor `npm run dev`.

> [!WARNING]
> Restaurar un respaldo eliminará los datos actuales. Asegúrate de hacer un backup manual antes de intentar una restauración.

## 📝 Logs del Sistema

Los logs se guardan en el directorio `logs/`.

### API de Respaldo de Logs
Puedes obtener un dump de los logs actuales vía API (requiere admin):
- **Endpoint**: `GET /api/v2/backup`
- **Acción**: Devuelve un JSON con estadísticas de uso y logs recientes.

## 🌐 Datos del Cliente (Browser)

El sistema también permite guardar y cargar backups del estado del navegador (análisis locales, borradores) desde el panel de configuración del usuario, gestionado por `BackupManager.js`.
