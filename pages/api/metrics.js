// pages/api/metrics.js
// Endpoint para métricas de salud del sistema (Health Check & Basic Metrics)
// Diseño compatible con scraping básico de Prometheus o monitoreo de uptime

import db from '../../lib/db';
import Logger from '../../lib/logger';

export const config = {
  runtime: 'nodejs', // Requiere Node.js para acceso a DB
};

export default function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const start = Date.now();
  let dbStatus = 'unknown';
  let dbLatency = 0;

  try {
    // 1. Check DB Connectivity (Simple Query)
    const dbStart = Date.now();
    // Intenta una query trivial
    db.query('SELECT 1');
    dbLatency = Date.now() - dbStart;
    dbStatus = 'up';
  } catch (error) {
    dbStatus = 'down';
    Logger.error('Health Check DB Failure', { error: error.message });
  }

  // 2. System Memory (Basic)
  const memoryUsage = process.memoryUsage();

  // 3. Response Construction
  const status = dbStatus === 'up' ? 'up' : 'degraded';
  const statusCode = status === 'up' ? 200 : 503;

  const metrics = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: {
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      memory: {
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      }
    },
    meta: {
      version: process.env.npm_package_version || '0.1.0',
      node_env: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local'
    }
  };

  // Log heartbeat only in dev to avoid noise, or on failure
  if (status !== 'up' || process.env.NODE_ENV === 'development') {
    Logger.info(`Health check: ${status}`, { dbStatus, dbLatency });
  }

  res.status(statusCode).json(metrics);
}
