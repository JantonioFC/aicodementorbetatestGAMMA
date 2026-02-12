/**
 * Analytics Service (Telemetry) - TypeScript Migration
 */
import { logger } from './observability/Logger';

const IS_DEV = process.env.NODE_ENV === 'development';

interface AnalyticsProperties {
    [key: string]: unknown;
}

export const Analytics = {
    track: (eventName: string, properties: AnalyticsProperties = {}): void => {
        try {
            // No-op in production for tracking events, as per "silent" requirement.
            // Error logging remains for critical issues.
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error('[Analytics] Error tracking event', { error: message });
        }
    },

    identify: (userId: string, traits: AnalyticsProperties = {}): void => {
        try {
            // No-op in production for identifying users, as per "silent" requirement.
            // Error logging remains for critical issues.
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error('[Analytics] Error identifying user', { error: message });
        }
    },

    conversion: (label: string, value: number = 0.0): void => {
        try {
            const win = window as unknown as {
                fbq?: (type: string, name: string, data: Record<string, unknown>) => void;
                gtag?: (type: string, name: string, data: Record<string, unknown>) => void;
            };
            if (typeof win.fbq === 'function') {
                win.fbq('track', label === 'purchase' ? 'Purchase' : 'CompleteRegistration', {
                    value: value,
                    currency: 'USD'
                });
            }
            if (typeof win.gtag === 'function') {
                win.gtag('event', 'conversion', {
                    'send_to': 'AW-CONVERSION_ID/' + label,
                    'value': value,
                    'currency': 'USD'
                });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error('[Analytics] Error tracking conversion', { error: message });
        }
    }
};
