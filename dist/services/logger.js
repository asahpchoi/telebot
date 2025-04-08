"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor() {
        this.prefix = '[TelegramBot]';
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    info(message, data) {
        console.log(`${this.prefix} ${message}`, data ? data : '');
    }
    error(message, error) {
        console.error(`${this.prefix} ${message}`, error ? error : '');
    }
    warn(message, data) {
        console.warn(`${this.prefix} ${message}`, data ? data : '');
    }
}
exports.Logger = Logger;
