import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from './types';
import { SupabaseService } from './services/supabase';
import { AIService } from './services/ai';
import { MessageHandler } from './handlers/messageHandler';
import { TelegramClientService } from './services/telegram/client';
import { validateEnvironment } from './config/environment';

class TelegramBotManager {
    private botInstances: TelegramBot[] = [];
    private readonly LOG_INTERVAL = 600000; // 10 seconds
    private messageHandler: MessageHandler;
    private google_api_key: string;

    constructor() {
        this.setupLogging();
        this.messageHandler = new MessageHandler();
        this.google_api_key = process.env.GOOGLE_API_KEY || '';
    }

    private async createBot(bot_id: string, bot_name: string): Promise<void> {
        // Initialize Telegram client
        const config = validateEnvironment();
        const telegramClient = new TelegramClientService(
            config.apiId,
            config.apiHash,
            config.phoneNumber
        );
        // Start Telegram client
        await telegramClient.start();
        const api_key = await telegramClient.createBot(bot_id, bot_name);
        console.log({ api_key });
        
        // Update the API key in Supabase
        await SupabaseService.updateBotApiKey(bot_id, api_key);
    }

    private setupLogging(): void {
        setInterval(() => {
            this.logBotStatus();
        }, this.LOG_INTERVAL);
    }

    private async logBotStatus(): Promise<void> {
        console.log('Current bot instances:', this.botInstances.length);
        const bots = await SupabaseService.getBotsConfig();
        console.log({ bots })
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
            await AIService.initialize(this.google_api_key);
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
            console.log({ bots })

            await Promise.all(bots.filter(bot => bot.api_key != 'tbc').map(bot => this.addBot(bot)));
            console.log('All bots started successfully');
            await Promise.all(bots.filter(bot => bot.api_key === 'tbc').map(async (bot) => {
                console.log(bot.name, bot.displayname)
                const token = await this.createBot(bot.name, bot.displayname)
                console.log({ token })
            }
            ));
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

async function main() {
    try {


        // Create and start the bot manager
        const botManager = new TelegramBotManager();
        await botManager.start();




        // Handle process termination
        process.on('SIGINT', async () => {
            console.log('Received SIGINT. Cleaning up...');
            botManager.cleanup();
            //await telegramClient.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM. Cleaning up...');
            botManager.cleanup();
            //await telegramClient.disconnect();
            process.exit(0);
        });
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();





