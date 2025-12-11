/**
 * MOTOR RAG - SISTEMA DE MÉTRICAS Y LOGGING
 * 
 * Módulo para recolección de métricas específicas del Motor RAG v5.0
 * Compatible con Prometheus/Grafana y logging estructurado
 * 
 * @author Mentor Coder
 * @version v1.0
 * @fecha 2025-09-16
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * CONFIGURACIÓN DE MÉTRICAS RAG
 */
const RAG_METRICS_CONFIG = {
  // Archivo de métricas acumulativas
  METRICS_FILE: path.join(process.cwd(), 'monitoring', 'rag-metrics.json'),
  
  // Archivo de logs estructurados
  LOGS_FILE: path.join(process.cwd(), 'monitoring', 'rag-logs.jsonl'),
  
  // Intervalo de flush a disco (ms)
  FLUSH_INTERVAL: 5000,
  
  // Métricas por defecto
  DEFAULT_METRICS: {
    // Contadores
    http_requests_total: 0,
    http_requests_errors_total: 0,
    rag_retrieve_sources_calls_total: 0,
    rag_cache_hits_total: 0,
    rag_cache_misses_total: 0,
    rag_fallback_legacy_total: 0,
    
    // Histogramas (acumulativos)
    http_request_duration_seconds: {
      sum: 0,
      count: 0,
      buckets: {
        '0.1': 0,   // 100ms
        '0.5': 0,   // 500ms
        '1.0': 0,   // 1s
        '2.0': 0,   // 2s
        '5.0': 0,   // 5s
        '+Inf': 0
      }
    },
    
    rag_retrieve_sources_duration_seconds: {
      sum: 0,
      count: 0,
      buckets: {
        '0.05': 0,  // 50ms
        '0.1': 0,   // 100ms
        '0.2': 0,   // 200ms
        '0.5': 0,   // 500ms
        '+Inf': 0
      }
    },
    
    rag_context_augmentation_duration_seconds: {
      sum: 0,
      count: 0,
      buckets: {
        '0.01': 0,  // 10ms
        '0.05': 0,  // 50ms
        '0.1': 0,   // 100ms
        '0.2': 0,   // 200ms
        '+Inf': 0
      }
    },
    
    // Gauges
    rag_curriculum_loaded: 1,
    rag_cache_healthy: 1,
    
    // Métricas por semana
    rag_requests_by_week: {},
    
    // Timestamps
    last_updated: new Date().toISOString(),
    started_at: new Date().toISOString()
  }
};

/**
 * CLASE PRINCIPAL DE MÉTRICAS RAG
 */
class RAGMetrics {
  constructor() {
    this.metrics = { ...RAG_METRICS_CONFIG.DEFAULT_METRICS };
    this.startTime = Date.now();
    this.flushTimer = null;
    
    // Inicializar flush automático
    this.setupAutoFlush();
  }
  
  /**
   * INCREMENTAR CONTADOR
   */
  incrementCounter(name, labels = {}, value = 1) {
    const labelKey = this.buildLabelKey(labels);
    const metricKey = labelKey ? `${name}{${labelKey}}` : name;
    
    if (!this.metrics[metricKey]) {
      this.metrics[metricKey] = 0;
    }
    
    this.metrics[metricKey] += value;
    this.updateTimestamp();
  }
  
  /**
   * ACTUALIZAR GAUGE
   */
  setGauge(name, value, labels = {}) {
    const labelKey = this.buildLabelKey(labels);
    const metricKey = labelKey ? `${name}{${labelKey}}` : name;
    
    this.metrics[metricKey] = value;
    this.updateTimestamp();
  }
  
  /**
   * OBSERVAR DURACIÓN (para histogramas)
   */
  observeDuration(name, durationMs, labels = {}) {
    const durationSeconds = durationMs / 1000;
    const labelKey = this.buildLabelKey(labels);
    const baseKey = labelKey ? `${name}{${labelKey}}` : name;
    
    if (!this.metrics[baseKey]) {
      this.metrics[baseKey] = {
        sum: 0,
        count: 0,
        buckets: { ...RAG_METRICS_CONFIG.DEFAULT_METRICS[name]?.buckets || {} }
      };
    }
    
    const metric = this.metrics[baseKey];
    metric.sum += durationSeconds;
    metric.count += 1;
    
    // Actualizar buckets
    for (const [bucket, _] of Object.entries(metric.buckets)) {
      const bucketValue = bucket === '+Inf' ? Infinity : parseFloat(bucket);
      if (durationSeconds <= bucketValue) {
        metric.buckets[bucket] += 1;
      }
    }
    
    this.updateTimestamp();
  }
  
  /**
   * LOGGING ESTRUCTURADO
   */
  async logEvent(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      service: 'motor-rag',
      message: message,
      context: context,
      version: 'v5.0'
    };
    
    // Log a consola
    const logMethod = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : console.log;
    logMethod(`[RAG-${level.toUpperCase()}]`, message, context);
    
    // Escribir a archivo de logs
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(RAG_METRICS_CONFIG.LOGS_FILE, logLine);
    } catch (error) {
      console.error('Error escribiendo log:', error);
    }
  }
  
  /**
   * MÉTRICAS ESPECÍFICAS DEL MOTOR RAG
   */
  
  // Llamada exitosa al endpoint
  recordSuccessfulRequest(weekId, pomodoroIndex, durationMs, ragEnabled = true) {
    this.incrementCounter('http_requests_total', { 
      endpoint: '/api/generate-lesson',
      status: '200'
    });
    
    this.observeDuration('http_request_duration_seconds', durationMs, {
      endpoint: '/api/generate-lesson'
    });
    
    // Métricas por semana
    const weekKey = `week_${weekId}`;
    if (!this.metrics.rag_requests_by_week[weekKey]) {
      this.metrics.rag_requests_by_week[weekKey] = 0;
    }
    this.metrics.rag_requests_by_week[weekKey] += 1;
    
    // Log estructurado
    this.logEvent('info', 'Request processed successfully', {
      weekId,
      pomodoroIndex,
      durationMs,
      ragEnabled,
      endpoint: '/api/generate-lesson'
    });
  }
  
  // Llamada con error
  recordFailedRequest(weekId, pomodoroIndex, durationMs, errorType, errorMessage) {
    this.incrementCounter('http_requests_total', {
      endpoint: '/api/generate-lesson',
      status: 'error'
    });
    
    this.incrementCounter('http_requests_errors_total', {
      endpoint: '/api/generate-lesson',
      error_type: errorType
    });
    
    this.observeDuration('http_request_duration_seconds', durationMs, {
      endpoint: '/api/generate-lesson'
    });
    
    // Log de error
    this.logEvent('error', 'Request failed', {
      weekId,
      pomodoroIndex,
      durationMs,
      errorType,
      errorMessage,
      endpoint: '/api/generate-lesson'
    });
  }
  
  // retrieve_sources() call
  recordRetrieveSources(weekId, durationMs, cacheHit = false) {
    this.incrementCounter('rag_retrieve_sources_calls_total', { week_id: weekId });
    this.observeDuration('rag_retrieve_sources_duration_seconds', durationMs);
    
    if (cacheHit) {
      this.incrementCounter('rag_cache_hits_total');
    } else {
      this.incrementCounter('rag_cache_misses_total');
    }
    
    this.logEvent('debug', 'retrieve_sources() executed', {
      weekId,
      durationMs,
      cacheHit
    });
  }
  
  // Context augmentation
  recordContextAugmentation(weekId, durationMs, promptType) {
    this.observeDuration('rag_context_augmentation_duration_seconds', durationMs, {
      prompt_type: promptType
    });
    
    this.logEvent('debug', 'Context augmentation completed', {
      weekId,
      durationMs,
      promptType
    });
  }
  
  // Fallback a sistema legacy
  recordLegacyFallback(weekId, reason) {
    this.incrementCounter('rag_fallback_legacy_total', { 
      week_id: weekId,
      reason: reason 
    });
    
    this.logEvent('warn', 'RAG fallback to legacy system', {
      weekId,
      reason,
      fallback_type: 'legacy'
    });
  }
  
  // Estado de salud del sistema
  updateHealthStatus(curriculumLoaded = true, cacheHealthy = true) {
    this.setGauge('rag_curriculum_loaded', curriculumLoaded ? 1 : 0);
    this.setGauge('rag_cache_healthy', cacheHealthy ? 1 : 0);
  }
  
  /**
   * UTILIDADES
   */
  
  buildLabelKey(labels) {
    return Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
  
  updateTimestamp() {
    this.metrics.last_updated = new Date().toISOString();
  }
  
  setupAutoFlush() {
    this.flushTimer = setInterval(async () => {
      await this.flushMetrics();
    }, RAG_METRICS_CONFIG.FLUSH_INTERVAL);
  }
  
  /**
   * PERSISTENCIA DE MÉTRICAS
   */
  async flushMetrics() {
    try {
      // Crear directorio si no existe
      const metricsDir = path.dirname(RAG_METRICS_CONFIG.METRICS_FILE);
      await fs.mkdir(metricsDir, { recursive: true });
      
      // Escribir métricas
      await fs.writeFile(
        RAG_METRICS_CONFIG.METRICS_FILE, 
        JSON.stringify(this.metrics, null, 2)
      );
      
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }
  
  /**
   * EXPORT DE MÉTRICAS PROMETHEUS
   */
  async exportPrometheusMetrics() {
    let output = '';
    
    // Contadores
    for (const [key, value] of Object.entries(this.metrics)) {
      if (typeof value === 'number' && key.includes('_total')) {
        output += `# TYPE ${key.split('{')[0]} counter\n`;
        output += `${key} ${value}\n`;
      }
    }
    
    // Histogramas
    for (const [key, value] of Object.entries(this.metrics)) {
      if (typeof value === 'object' && value.buckets) {
        const baseName = key.split('{')[0];
        output += `# TYPE ${baseName} histogram\n`;
        
        for (const [bucket, count] of Object.entries(value.buckets)) {
          const bucketKey = key.includes('{') ? 
            key.replace('}', `,le="${bucket}"}`) : 
            `${baseName}_bucket{le="${bucket}"}`;
          output += `${bucketKey} ${count}\n`;
        }
        
        const sumKey = key.replace('_seconds', '_seconds_sum');
        const countKey = key.replace('_seconds', '_seconds_count');
        output += `${sumKey} ${value.sum}\n`;
        output += `${countKey} ${value.count}\n`;
      }
    }
    
    // Gauges
    for (const [key, value] of Object.entries(this.metrics)) {
      if (typeof value === 'number' && !key.includes('_total') && !key.includes('_bucket')) {
        if (!['last_updated', 'started_at'].includes(key)) {
          output += `# TYPE ${key} gauge\n`;
          output += `${key} ${value}\n`;
        }
      }
    }
    
    return output;
  }
  
  /**
   * ESTADÍSTICAS RESUMIDAS
   */
  getSummaryStats() {
    const uptime = Date.now() - this.startTime;
    const totalRequests = this.metrics['http_requests_total{endpoint="/api/generate-lesson",status="200"}'] || 0;
    const totalErrors = this.metrics['http_requests_errors_total{endpoint="/api/generate-lesson"}'] || 0;
    const cacheHits = this.metrics.rag_cache_hits_total || 0;
    const cacheMisses = this.metrics.rag_cache_misses_total || 0;
    const legacyFallbacks = Object.values(this.metrics)
      .filter(key => String(key).includes('rag_fallback_legacy_total'))
      .reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    
    return {
      uptime_ms: uptime,
      uptime_human: this.formatDuration(uptime),
      
      requests: {
        total: totalRequests,
        errors: totalErrors,
        error_rate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%',
        success_rate: totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests * 100).toFixed(2) + '%' : '100%'
      },
      
      cache: {
        hits: cacheHits,
        misses: cacheMisses,
        total: cacheHits + cacheMisses,
        hit_rate: (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2) + '%' : '0%'
      },
      
      rag: {
        legacy_fallbacks: legacyFallbacks,
        fallback_rate: totalRequests > 0 ? (legacyFallbacks / totalRequests * 100).toFixed(2) + '%' : '0%'
      },
      
      health: {
        curriculum_loaded: this.metrics.rag_curriculum_loaded === 1,
        cache_healthy: this.metrics.rag_cache_healthy === 1,
        system_healthy: this.metrics.rag_curriculum_loaded === 1 && this.metrics.rag_cache_healthy === 1
      },
      
      last_updated: this.metrics.last_updated,
      started_at: this.metrics.started_at
    };
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  /**
   * CLEANUP
   */
  cleanup() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    return this.flushMetrics();
  }
}

// Singleton instance
let ragMetricsInstance = null;

/**
 * FACTORY FUNCTION
 */
function getRagMetrics() {
  if (!ragMetricsInstance) {
    ragMetricsInstance = new RAGMetrics();
  }
  return ragMetricsInstance;
}

module.exports = {
  RAGMetrics,
  getRagMetrics,
  RAG_METRICS_CONFIG
};

/**
 * EJEMPLO DE USO:
 * 
 * const { getRagMetrics } = require('./rag-metrics');
 * const metrics = getRagMetrics();
 * 
 * // En el endpoint /api/generate-lesson.js:
 * const startTime = Date.now();
 * 
 * try {
 *   const ragContext = await retrieve_sources(weekId);
 *   metrics.recordRetrieveSources(weekId, Date.now() - retrieveStart, true);
 *   
 *   const augmentStart = Date.now();
 *   const prompt = generateContextualPromptRAG(weekId, pomodoroIndex, text);
 *   metrics.recordContextAugmentation(weekId, Date.now() - augmentStart, 'teorico');
 *   
 *   const result = await generateWithLLM(prompt);
 *   metrics.recordSuccessfulRequest(weekId, pomodoroIndex, Date.now() - startTime, true);
 *   
 *   res.json(result);
 *   
 * } catch (error) {
 *   metrics.recordFailedRequest(weekId, pomodoroIndex, Date.now() - startTime, error.name, error.message);
 *   res.status(500).json({ error: error.message });
 * }
 */
