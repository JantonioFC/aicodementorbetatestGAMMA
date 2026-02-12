/**
 * PERFORMANCE MONITOR - AUTO-INICIADO
 * 
 * Componente que inyecta el script de monitoreo automáticamente en desarrollo.
 * 
 * Características:
 * - Se inicia automáticamente al cargar la página
 * - Monitorea todas las métricas en tiempo real
 * - Genera reportes automáticos cada 10 segundos
 * - Guarda logs en localStorage para análisis posterior
 * 
 * Control:
 * - Para activar/desactivar: window.togglePerformanceMonitor()
 * - Para ver reporte: window.showPerformanceReport()
 * - Para exportar: window.exportPerformanceReport()
 * 
 * @author Mentor Coder
 * @version 2.0 - Auto-Start
 */

import { useEffect } from 'react';
import { logger } from '@/lib/observability/Logger';




interface PerformanceConfig {
  AUTO_REPORT_INTERVAL: number;
  SAVE_TO_STORAGE: boolean;
  LOG_TO_CONSOLE: boolean;
  TRACK_INTERACTIONS: boolean;
  MONITOR_APIS: string[];
}

interface PageLoadMetrics {
  connectionTime?: number;
  requestTime?: number;
  responseTime?: number;
  domInteractive?: number;
  domComplete?: number;
  domContentLoaded?: number;
  loadComplete?: number;
  totalTime?: number;
}

interface WebVitalsMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
}

interface APICall {
  url: string;
  method: string;
  status: number;
  duration: number;
  payloadSize: number;
  payloadSizeKB: number;
  timestamp: string;
  relativeTime: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  sizeKB: number;
}

interface UserInteraction {
  type: string;
  element?: string;
  testId?: string | null;
  text?: string | null;
  timestamp: number;
  from?: string;
  to?: string;
}

interface CustomMark {
  name: string;
  timestamp: number;
  relativeTime: number;
}

interface PerformanceMetricsData {
  pageLoad: PageLoadMetrics;
  webVitals: WebVitalsMetrics;
  apiCalls: APICall[];
  resourceTimings: ResourceTiming[];
  userInteractions: UserInteraction[];
  customMarks: CustomMark[];
  startTime: number;
  pageName: string;
  sessionId: number;
}

interface LCPEntry extends PerformanceEntry {
  renderTime?: number;
  loadTime?: number;
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

declare global {
  interface Window {
    __performanceMonitorActive: boolean;
    __performanceMetrics: PerformanceMetricsData;
    togglePerformanceMonitor: () => void;
    showPerformanceReport: () => void;
    exportPerformanceReport: () => void;
    savePerformanceLog: () => Promise<{ filename: string } | null>;
    getPerformanceHistory: () => PerformanceMetricsData[];
    markPerformance: (name: string) => void;
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    // Verificar si ya está inicializado
    if (window.__performanceMonitorActive) {
      logger.warn('⚠️ Performance Monitor ya está activo');
      return;
    }

    logger.info('🚀 Iniciando Performance Monitor automático...');

    // === CONFIGURACIÓN ===
    const CONFIG: PerformanceConfig = {
      AUTO_REPORT_INTERVAL: 10000, // Reporte cada 10 segundos
      SAVE_TO_STORAGE: true,        // Guardar en localStorage
      LOG_TO_CONSOLE: true,         // Log en consola
      TRACK_INTERACTIONS: true,     // Track clicks y navegación
      MONITOR_APIS: [
        '/api/v1/curriculum/summary',
        '/api/v1/phases',
        '/api/v1/weeks',
        '/api/analyze'
      ]
    };

    // === ALMACENAMIENTO DE MÉTRICAS ===
    const metrics: PerformanceMetricsData = {
      pageLoad: {},
      webVitals: {},
      apiCalls: [],
      resourceTimings: [],
      userInteractions: [],
      customMarks: [],
      startTime: performance.now(),
      pageName: window.location.pathname,
      sessionId: Date.now()
    };

    // === CAPTURA DE NAVIGATION TIMING ===
    function captureNavigationTiming() {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        metrics.pageLoad = {
          connectionTime: Math.round(perfData.connectEnd - perfData.connectStart),
          requestTime: Math.round(perfData.responseStart - perfData.requestStart),
          responseTime: Math.round(perfData.responseEnd - perfData.responseStart),
          domInteractive: Math.round(perfData.domInteractive - perfData.fetchStart),
          domComplete: Math.round(perfData.domComplete - perfData.fetchStart),
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
          loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
          totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
        };

        if (CONFIG.LOG_TO_CONSOLE) {
          logger.debug('⏱️  Navigation Timing:', { ...metrics.pageLoad });
        }
      }
    }

    // === CAPTURA DE WEB VITALS ===
    function captureWebVitals() {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as LCPEntry;
        metrics.webVitals.LCP = Math.round(lastEntry.renderTime || lastEntry.loadTime || 0);

        if (CONFIG.LOG_TO_CONSOLE) {
          logger.debug(`🎨 LCP: ${metrics.webVitals.LCP}ms`);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as FIDEntry;
          metrics.webVitals.FID = Math.round(fidEntry.processingStart - fidEntry.startTime);
          if (CONFIG.LOG_TO_CONSOLE) {
            logger.debug(`⚡ FID: ${metrics.webVitals.FID}ms`);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        metrics.webVitals.CLS = Math.round(clsScore * 1000) / 1000;
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            metrics.webVitals.FCP = Math.round(entry.startTime);
            if (CONFIG.LOG_TO_CONSOLE) {
              logger.debug(`🖼️  FCP: ${metrics.webVitals.FCP}ms`);
            }
          }
        });
      }).observe({ entryTypes: ['paint'] });
    }

    // === MONITOREO DE APIs ===
    function monitorAPIs() {
      const originalFetch = window.fetch;

      window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const startTime = performance.now();
        const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);

        return originalFetch.apply(this, [input, init]).then(response => {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTime);

          const clonedResponse = response.clone();
          clonedResponse.json().then(data => {
            const payloadSize = new Blob([JSON.stringify(data)]).size;

            const apiCall: APICall = {
              url,
              method: init?.method || 'GET',
              status: response.status,
              duration,
              payloadSize,
              payloadSizeKB: Math.round(payloadSize / 1024 * 100) / 100,
              timestamp: new Date().toISOString(),
              relativeTime: Math.round(performance.now() - metrics.startTime)
            };

            metrics.apiCalls.push(apiCall);

            const isMonitored = CONFIG.MONITOR_APIS.some(api => url.includes(api));
            if (isMonitored && CONFIG.LOG_TO_CONSOLE) {
              logger.debug(`🔌 API: ${url.split('/').slice(-3).join('/')}`);
              logger.debug(`   ⏱️  ${duration}ms | 💾 ${apiCall.payloadSizeKB} KB`);
            }
          }).catch(() => {
            const apiCall: APICall = {
              url,
              method: init?.method || 'GET',
              status: response.status,
              duration,
              payloadSize: 0,
              payloadSizeKB: 0,
              timestamp: new Date().toISOString(),
              relativeTime: Math.round(performance.now() - metrics.startTime)
            };
            metrics.apiCalls.push(apiCall);
          });

          return response;
        });
      };
    }

    // === TRACKING DE INTERACCIONES ===
    function trackInteractions() {
      if (!CONFIG.TRACK_INTERACTIONS) return;

      // Clicks
      document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('[data-testid], button, a') as HTMLElement;
        if (target) {
          const interaction: UserInteraction = {
            type: 'click',
            element: target.tagName,
            testId: target.dataset.testid || null,
            text: target.textContent?.slice(0, 50) || null,
            timestamp: Math.round(performance.now() - metrics.startTime)
          };
          metrics.userInteractions.push(interaction);
        }
      }, true);

      // Navegación
      let lastPath = window.location.pathname;
      const checkNavigation = () => {
        const currentPath = window.location.pathname;
        if (currentPath !== lastPath) {
          metrics.userInteractions.push({
            type: 'navigation',
            from: lastPath,
            to: currentPath,
            timestamp: Math.round(performance.now() - metrics.startTime)
          });
          lastPath = currentPath;

          if (CONFIG.LOG_TO_CONSOLE) {
            logger.debug(`🔄 Navegación: ${currentPath}`);
          }
        }
      };
      setInterval(checkNavigation, 500);
    }

    // === CAPTURA DE RESOURCES ===
    function captureResourceTimings() {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      metrics.resourceTimings = resources.map(resource => ({
        name: resource.name.split('/').pop() || resource.name,
        type: resource.initiatorType,
        duration: Math.round(resource.duration),
        size: resource.transferSize || 0,
        sizeKB: Math.round((resource.transferSize || 0) / 1024 * 100) / 100
      }));
    }

    // === GENERAR REPORTE ===
    function generateReport() {
      const report = {
        metadata: {
          page: metrics.pageName,
          url: window.location.href,
          sessionId: metrics.sessionId,
          timestamp: new Date().toISOString(),
          duration: Math.round(performance.now() - metrics.startTime),
          mission: '213.0 - Performance Optimization'
        },

        summary: {
          totalLoadTime: metrics.pageLoad.totalTime || 0,
          domContentLoaded: metrics.pageLoad.domContentLoaded || 0,
          firstContentfulPaint: metrics.webVitals.FCP || 0,
          largestContentfulPaint: metrics.webVitals.LCP || 0,
          cumulativeLayoutShift: metrics.webVitals.CLS || 0,
          apiCallsCount: metrics.apiCalls.length,
          totalPayloadKB: Math.round(
            metrics.apiCalls.reduce((sum, call) => sum + call.payloadSizeKB, 0) * 100
          ) / 100,
          userInteractionsCount: metrics.userInteractions.length
        },

        pageLoad: metrics.pageLoad,
        webVitals: metrics.webVitals,
        apiCalls: metrics.apiCalls,
        userInteractions: metrics.userInteractions,
        resourceTimings: metrics.resourceTimings.slice(0, 20),
        customMarks: metrics.customMarks
      };

      return report;
    }

    // === MOSTRAR REPORTE ===
    function displayReport() {
      const report = generateReport();

      logger.info('\n' + '='.repeat(70));
      logger.info('📊 PERFORMANCE REPORT - Auto-Monitor');
      logger.info('='.repeat(70));

      logger.info(`\n📄 Session: ${report.metadata.sessionId}`);
      logger.info(`🕐 Duration: ${Math.round(report.metadata.duration / 1000)} seconds`);

      logger.info('\n📈 Summary:');
      console.table({
        'Load Time (ms)': report.summary.totalLoadTime,
        'DOM Ready (ms)': report.summary.domContentLoaded,
        'FCP (ms)': report.summary.firstContentfulPaint,
        'LCP (ms)': report.summary.largestContentfulPaint,
        'CLS': report.summary.cumulativeLayoutShift,
        'API Calls': report.summary.apiCallsCount,
        'Total Payload (KB)': report.summary.totalPayloadKB,
        'Interactions': report.summary.userInteractionsCount
      });

      // APIs recientes
      const recentAPIs = report.apiCalls.slice(-5);
      if (recentAPIs.length > 0) {
        logger.info('\n🔌 Recent API Calls:');
        console.table(recentAPIs.map(call => ({
          'API': call.url.split('/').slice(-3).join('/'),
          'Time (ms)': call.duration,
          'Size (KB)': call.payloadSizeKB,
          'Status': call.status
        })));
      }

      // Interacciones recientes
      const recentInteractions = report.userInteractions.slice(-5);
      if (recentInteractions.length > 0) {
        logger.info('\n👆 Recent Interactions:');
        console.table(recentInteractions);
      }

      logger.info('\n' + '='.repeat(70));
      logger.info('Commands:');
      logger.info('  window.showPerformanceReport() - Ver reporte completo');
      logger.info('  window.savePerformanceLog() - Guardar en /performance-logs/');
      logger.info('  window.exportPerformanceReport() - Descargar JSON');
      logger.info('  window.getPerformanceHistory() - Ver historial');
      logger.info('  window.togglePerformanceMonitor() - ON/OFF');
      logger.info('='.repeat(70) + '\n');
    }

    // === GUARDAR EN STORAGE ===
    function saveToStorage() {
      if (!CONFIG.SAVE_TO_STORAGE) return;

      const report = generateReport();
      const historyStr = localStorage.getItem('performanceHistory');
      const history: unknown[] = historyStr ? JSON.parse(historyStr) : [];
      history.push(report);

      // Mantener solo últimos 10 reportes
      if (history.length > 10) {
        history.shift();
      }

      localStorage.setItem('performanceHistory', JSON.stringify(history));
    }

    // === GUARDAR EN DISCO (SERVIDOR) ===
    async function saveToDisk(): Promise<{ filename: string } | null> {
      const report = generateReport();

      try {
        const response = await fetch('/api/save-performance-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ report }),
        });

        if (response.ok) {
          const data = await response.json() as { filename: string };
          logger.info(`✅ Log guardado en servidor: ${data.filename}`);
          return data;
        } else {
          logger.error('❌ Error guardando log en servidor');
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Error en saveToDisk: ${message}`);
        return null;
      }
    }

    // === GUARDAR AL CERRAR (BEACON API) ===
    function saveOnUnload() {
      const report = generateReport();
      const blob = new Blob([JSON.stringify({ report })], { type: 'application/json' });

      // Usar Beacon API para garantizar que se envíe incluso al cerrar
      const sent = navigator.sendBeacon('/api/save-performance-log', blob);

      if (sent) {
        logger.info('📤 Performance log enviado al servidor (al cerrar)');
      } else {
        logger.warn('⚠️  No se pudo enviar log al cerrar');
      }
    }

    // === EXPORTAR REPORTE (DESCARGA NAVEGADOR) ===
    window.exportPerformanceReport = function () {
      const report = generateReport();
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perf-${metrics.pageName.replace(/\//g, '-')}-${metrics.sessionId}.json`;
      a.click();
      logger.info('✅ Report exported (descarga)');
    };

    // === GUARDAR EN SERVIDOR (MANUAL) ===
    window.savePerformanceLog = async function () {
      logger.info('💾 Guardando log en servidor...');
      const result = await saveToDisk();
      if (result) {
        logger.info(`✅ Guardado en: performance-logs/${result.filename}`);
      }
      return result;
    };

    // === VER HISTORIAL ===
    window.getPerformanceHistory = function () {
      const historyStr = localStorage.getItem('performanceHistory');
      const history: Record<string, unknown>[] = historyStr ? JSON.parse(historyStr) : [];
      logger.info(`📚 Performance History (${history.length} sessions):`);
      console.table(history.map((h) => {
        const meta = h.metadata as Record<string, unknown> | undefined;
        const sum = h.summary as Record<string, unknown> | undefined;
        return {
          Page: meta?.page ?? h.pageName,
          Duration: Math.round(((meta?.duration as number) ?? 0) / 1000) + 's',
          'Load Time': (sum?.totalLoadTime ?? 0) + 'ms',
          'API Calls': sum?.apiCallsCount ?? 0,
          'Payload (KB)': sum?.totalPayloadKB ?? 0,
          Timestamp: meta?.timestamp ? new Date(meta.timestamp as string).toLocaleTimeString() : 'N/A'
        };
      }));
      return history as unknown as PerformanceMetricsData[];
    };

    // === TOGGLE MONITOR ===
    window.togglePerformanceMonitor = function () {
      window.__performanceMonitorActive = !window.__performanceMonitorActive;
      CONFIG.LOG_TO_CONSOLE = window.__performanceMonitorActive;
      logger.info(
        window.__performanceMonitorActive
          ? '✅ Performance Monitor ACTIVADO'
          : '⏸️  Performance Monitor PAUSADO'
      );
    };

    // === MOSTRAR REPORTE ON-DEMAND ===
    window.showPerformanceReport = displayReport;

    // === MARCAR EVENTO ===
    window.markPerformance = function (name: string) {
      const timestamp = performance.now();
      metrics.customMarks.push({
        name,
        timestamp: Math.round(timestamp),
        relativeTime: Math.round(timestamp - metrics.startTime)
      });
      if (CONFIG.LOG_TO_CONSOLE) {
        logger.debug(`🏁 Mark: ${name} @ ${Math.round(timestamp)}ms`);
      }
    };

    // === INICIALIZACIÓN ===
    function init() {
      if (document.readyState === 'complete') {
        captureNavigationTiming();
        captureResourceTimings();
      } else {
        window.addEventListener('load', () => {
          captureNavigationTiming();
          captureResourceTimings();
        });
      }

      captureWebVitals();
      monitorAPIs();
      trackInteractions();

      // Reportes automáticos
      const reportInterval = setInterval(() => {
        if (window.__performanceMonitorActive) {
          displayReport();
          saveToStorage();
        }
      }, CONFIG.AUTO_REPORT_INTERVAL);

      // Guardar al cerrar navegador/tab
      window.addEventListener('beforeunload', saveOnUnload);

      // Limpiar en unmount
      return () => {
        clearInterval(reportInterval);
        window.removeEventListener('beforeunload', saveOnUnload);
      };
    }

    // === EJECUTAR ===
    const cleanup = init();
    window.__performanceMonitorActive = true;
    window.__performanceMetrics = metrics;

    logger.info('✅ Performance Monitor ACTIVO');
    logger.info(`📊 Reportes automáticos cada ${CONFIG.AUTO_REPORT_INTERVAL / 1000} segundos`);
    logger.info('💾 Guardando en localStorage');
    logger.info('📁 Guardado automático en: /performance-logs/');
    logger.info('👆 Tracking de interacciones: ON');
    logger.info('\nComandos:');
    logger.info('  window.savePerformanceLog() - Guardar ahora en servidor');
    logger.info('  window.togglePerformanceMonitor() - Pausar/reanudar');
    logger.info('  window.showPerformanceReport() - Ver reporte\n');
    logger.info('ℹ️  Al cerrar el navegador, el log se guarda automáticamente\n');

    // Cleanup en unmount
    return cleanup;
  }, []);

  // No renderiza nada
  return null;
}

