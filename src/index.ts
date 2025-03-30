import TelegramBot, { Message } from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { ask } from './model';
import { getBotsConfig, getBotConfig, getChatHistory, BotConfig, saveChatHistory, getUploadPhotos, UploadedPhoto } from './supabase';

// Load environment variables
dotenv.config();

class TelegramBotManager {
    private botInstances: TelegramBot[] = [];
    private readonly LOG_INTERVAL = 10000; // 10 seconds

    constructor() {
        this.setupLogging();
    }

    private setupLogging(): void {
        setInterval(() => {
            this.logBotStatus();
        }, this.LOG_INTERVAL);
    }

    private async logBotStatus(): Promise<void> {
        console.log('Current bot instances:', this.botInstances.length);
        const bots = await getBotsConfig();
        console.log('Configured bots:', bots?.length);
    }

    private setupBotHandlers(bot: TelegramBot, botConfig: BotConfig): void {
        // Handle /image command
        bot.onText(/\/image/, async (msg: Message) => {
            const chatId = msg.chat.id;
            console.log({ chatId });
            await this.handleImageCommand(bot, chatId, botConfig.id);
        });

        // Handle regular messages
        bot.on('message', async (msg: Message) => {
            await this.handleMessage(bot, msg, botConfig);
        });

        // Handle errors
        bot.on('polling_error', (error: Error) => {
            console.error('Polling error:', error);
        });
    }

    private async handleImageCommand(bot: TelegramBot, chatId: number, botId: string): Promise<void> {
        try {
            const chat = (await bot.getChat(chatId));
            console.log({botId});
            const photos = await getUploadPhotos(chatId.toString(), botId);
            console.log({photos});
            
            if (photos.length === 0) {
                await bot.sendMessage(chatId, "No uploaded photos found.");
                return;
            }
            
            for (const photo of photos) {
                await bot.sendPhoto(chatId, photo.photo_url);
            }
            
            // await bot.sendPhoto(chatId, 'gemini-native-image.png');
        } catch (error) {
            console.error('Error handling image command:', error);
            await bot.sendMessage(chatId, "Error retrieving photos.");
        }
    }

    private async handleMessage(bot: TelegramBot, msg: Message, botConfig: BotConfig): Promise<void> {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Ignore commands
        if (text?.startsWith('/')) {
            return;
        }

        try {
            const currentConfig = await getBotConfig(botConfig.id);
            const systemPrompt = currentConfig?.system_prompt || botConfig.system_prompt;

            if (text) {
                const chatHistory = await getChatHistory(chatId.toString())
                const answer = await ask(text, systemPrompt, chatHistory);
                await bot.sendMessage(chatId, answer);
                const chat = await bot.getChat(chatId);
                console.log({chat});
                
                // Get a user identifier - username if available, otherwise use first_name or chat ID
                const userId = chat.username || 
                               chat.first_name || 
                               chat.title || 
                               chatId.toString();
                
                saveChatHistory(botConfig.id, userId, chatId.toString(), text, answer);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your message.');
        }
    }

    private async addBot(botConfig: BotConfig): Promise<void> {
        try {
            const bot = new TelegramBot(botConfig.api_key, { polling: true });
            this.botInstances.push(bot);
            this.setupBotHandlers(bot, botConfig);
            console.log('Bot added:', botConfig.name);
        } catch (error) {
            console.error(`Error adding bot ${botConfig.name}:`, error);
        }
    }

    public async start(): Promise<void> {
        console.log('Starting bot manager...');
        try {
            const bots = await getBotsConfig();
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

 



