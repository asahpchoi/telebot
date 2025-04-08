import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from '../types';
import { IBotInstance } from '../types/manager';
import { MessageHandler } from '../handlers/messageHandler';
import { Logger } from './logger';

export class BotInstance implements IBotInstance {
    private readonly logger = Logger.getInstance();
    private readonly messageHandler: MessageHandler;

    constructor(
        public readonly bot: TelegramBot,
        public readonly config: BotConfig
    ) {
        this.messageHandler = new MessageHandler();
        this.setupHandlers();
    }

    private setupHandlers(): void {
        // Handle /image command
        this.bot.onText(/\/image/, async (msg) => {
            const chatId = msg.chat.id;
            await this.messageHandler.handleImageCommand(this.bot, chatId, this.config.id);
        });

        // Handle regular messages
        this.bot.on('message', async (msg) => {
            await this.messageHandler.handleMessage(this.bot, msg, this.config);
        });

        // Handle errors
        this.bot.on('polling_error', (error: Error) => {
            this.logger.error('Polling error:', error);
        });
    }

    async start(): Promise<void> {
        try {
            this.logger.info(`Starting bot: ${this.config.displayname}`);
            // Additional startup logic if needed
        } catch (error) {
            this.logger.error(`Error starting bot ${this.config.displayname}:`, error);
            throw error;
        }
    }

    stop(): void {
        try {
            this.bot.close();
            this.logger.info(`Stopped bot: ${this.config.displayname}`);
        } catch (error) {
            this.logger.error(`Error stopping bot ${this.config.displayname}:`, error);
        }
    }
} 