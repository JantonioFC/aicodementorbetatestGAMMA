/**
 * Structured Logger using Pino-like interface.
 * 
 * - In Development: Prints pretty-formatted logs for readability.
 * - In Production: Prints JSON logs for easy ingestion by observability tools.
 */

const isProduction = process.env.NODE_ENV === 'production';

const formatMessage = (level: string, message: string, context: Record<string, any> = {}) => {
    const timestamp = new Date().toISOString();

    if (isProduction) {
        return JSON.stringify({
            level,
            timestamp,
            message,
            ...context,
        });
    }

    // Development format
    const contextStr = Object.keys(context).length ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
};

const Logger = {
    info: (message: string, context: Record<string, any> = {}) => console.log(formatMessage('info', message, context)),
    warn: (message: string, context: Record<string, any> = {}) => console.warn(formatMessage('warn', message, context)),
    error: (message: string, context: Record<string, any> = {}) => console.error(formatMessage('error', message, context)),
    debug: (message: string, context: Record<string, any> = {}) => {
        if (!isProduction) {
            console.debug(formatMessage('debug', message, context));
        }
    },
};

export default Logger;
