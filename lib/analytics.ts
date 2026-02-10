/**
 * Analytics Service (Telemetry) - TypeScript Migration
 */

const IS_DEV = process.env.NODE_ENV === 'development';

interface AnalyticsProperties {
    [key: string]: any;
}

export const Analytics = {
    track: (eventName: string, properties: AnalyticsProperties = {}) => {
        try {
            if (IS_DEV || typeof window !== 'undefined') {
                const timestamp = new Date().toISOString();
                console.groupCollapsed(`📊 [Analytics] ${eventName}`);
                console.log('Properties:', properties);
                console.log('Timestamp:', timestamp);
                console.groupEnd();
            }
        } catch (err) {
            console.error('[Analytics] Error tracking event:', err);
        }
    },

    identify: (userId: string, traits: AnalyticsProperties = {}) => {
        try {
            console.log(`👤 [Analytics] Identify: ${userId}`, traits);
        } catch (err) {
            console.error('[Analytics] Error identifying user:', err);
        }
    },

    conversion: (label: string, value: number = 0.0) => {
        try {
            console.log(`💰 [Analytics] Conversion: ${label} ($${value})`);
            const win = window as any;
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
            console.error('[Analytics] Error tracking conversion:', err);
        }
    }
};
