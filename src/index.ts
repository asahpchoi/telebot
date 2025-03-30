import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { BotConfig } from './types';
import { SupabaseService } from './services/supabase';
import { AIService } from './services/ai';
import { MessageHandler } from './handlers/messageHandler';

// Load environment variables
dotenv.config();

class TelegramBotManager {
    private botInstances: TelegramBot[] = [];
    private readonly LOG_INTERVAL = 10000; // 10 seconds
    private messageHandler: MessageHandler;

    constructor() {
        this.setupLogging();
        this.messageHandler = new MessageHandler();
    }

    private setupLogging(): void {
        setInterval(() => {
            this.logBotStatus();
        }, this.LOG_INTERVAL);
    }

    private async logBotStatus(): Promise<void> {
        console.log('Current bot instances:', this.botInstances.length);
        const bots = await SupabaseService.getBotsConfig();
        console.log('Configured bots:', bots?.map(bot => bot.displayname).join(', '));
    }

    private setupBotHandlers(bot: TelegramBot, botConfig: BotConfig): void {
        // Handle /image command
        bot.onText(/\/image/, async (msg) => {
            const chatId = msg.chat.id;
            console.log({ chatId });
            await this.messageHandler.handleImageCommand(bot, chatId, botConfig.id);
        });

        // Handle regular messages
        bot.on('message', async (msg) => {
            await this.messageHandler.handleMessage(bot, msg, botConfig);
        });

        // Handle errors
        bot.on('polling_error', (error: Error) => {
            console.error('Polling error:', error);
        });
    }

    private async addBot(botConfig: BotConfig): Promise<void> {
        try {
            const bot = new TelegramBot(botConfig.api_key, { polling: true });
            this.botInstances.push(bot);
            this.setupBotHandlers(bot, botConfig);
            await AIService.initialize(botConfig);
            console.log('Bot added:', botConfig.displayname);
        } catch (error) {
            console.error(`Error adding bot ${botConfig.displayname}:`, error);
        }
    }

    public async start(): Promise<void> {
        console.log('Starting bot manager...');
        try {
            const bots = await SupabaseService.getBotsConfig();
            if (!bots || bots.length === 0) {
                console.error('No bots found in configuration');
                return;
            }

            await Promise.all(bots.map(bot => this.addBot(bot)));
            console.log('All bots started successfully');
        } catch (error) {
            console.error('Error starting bots:', error);
        }
    }

    public cleanup(): void {
        console.log('Cleaning up bot instances...');
        this.botInstances.forEach(bot => {
            try {
                bot.close();
            } catch (error) {
                console.error('Error closing bot:', error);
            }
        });
        this.botInstances = [];
    }
}

// Create and start the bot manager
const botManager = new TelegramBotManager();
botManager.start();

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    botManager.cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Cleaning up...');
    botManager.cleanup();
    process.exit(0);
});

 



