interface LokiLogEntry {
    streams: {
        stream: Record<string, string>;
        values: [string, string][];
    }[];
}

export class LokiLogger {
    private baseUrl: string;
    private defaultLabels: Record<string, string>;

    constructor(lokiUrl: string, defaultLabels: Record<string, string> = {}) {
        this.baseUrl = lokiUrl.endsWith('/') ? lokiUrl : `${lokiUrl}/`;
        this.defaultLabels = defaultLabels;
    }

    async log(message: string, level: string, labels: Record<string, string> = {}) {
        const timestamp = Date.now().toString() + '000000'; // Nanosecond precision
        const streamLabels = {
            ...this.defaultLabels,
            level,
            ...labels
        };

        const logEntry: LokiLogEntry = {
            streams: [
                {
                    stream: streamLabels,
                    values: [[timestamp, message]]
                }
            ]
        };

        try {
            await fetch(`${this.baseUrl}loki/api/v1/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Failed to send log to Loki:', error);
        }
    }

    error(message: string, labels: Record<string, string> = {}) {
        return this.log(message, 'error', labels);
    }

    info(message: string, labels: Record<string, string> = {}) {
        return this.log(message, 'info', labels);
    }

    warn(message: string, labels: Record<string, string> = {}) {
        return this.log(message, 'warn', labels);
    }
}
