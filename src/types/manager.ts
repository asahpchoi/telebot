import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from './index';

export interface ITelegramBotManager {
    start(): Promise<void>;
    cleanup(): void;
}

export interface IBotInstance {
    bot: TelegramBot;
    config: BotConfig;
    start(): Promise<void>;
    stop(): void;
}

export interface ILogger {
    info(message: string, data?: any): void;
    error(message: string, error?: any): void;
    warn(message: string, data?: any): void;
}

export interface IConfig {
    logInterval: number;
    maxRetries: number;
    retryDelay: number;
} 