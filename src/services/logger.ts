import { ILogger } from '../types/manager';

export class Logger implements ILogger {
    private static instance: Logger;
    private readonly prefix = '[TelegramBot]';

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    info(message: string, data?: any): void {
        console.log(`${this.prefix} ${message}`, data ? data : '');
    }

    error(message: string, error?: any): void {
        console.error(`${this.prefix} ${message}`, error ? error : '');
    }

    warn(message: string, data?: any): void {
        console.warn(`${this.prefix} ${message}`, data ? data : '');
    }
} 