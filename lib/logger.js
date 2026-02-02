/**
 * Structured Logger using Pino-like interface.
 * 
 * - In Development: Prints pretty-formatted logs for readability.
 * - In Production: Prints JSON logs for easy ingestion by observability tools.
 */

const isProduction = process.env.NODE_ENV === 'production';

const formatMessage = (level, message, context = {}) => {
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
    info: (message, context) => console.log(formatMessage('info', message, context)),
    warn: (message, context) => console.warn(formatMessage('warn', message, context)),
    error: (message, context) => console.error(formatMessage('error', message, context)),
    debug: (message, context) => {
        if (!isProduction) {
            console.debug(formatMessage('debug', message, context));
        }
    },
};

export default Logger;
