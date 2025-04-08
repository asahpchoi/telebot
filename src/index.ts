import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from './types';
import { SupabaseService } from './services/supabase';
import { AIService } from './services/ai';
import { TelegramClientService } from './services/telegram/client';
import { validateEnvironment } from './config/environment';
import { ITelegramBotManager, IConfig } from './types/manager';
import { BotInstance } from './services/botInstance';
import { Logger } from './services/logger';

/**
 * Main class responsible for managing multiple Telegram bots.
 * Implements the ITelegramBotManager interface to ensure consistent behavior.
 */
class TelegramBotManager implements ITelegramBotManager {
    // Store active bot instances
    private readonly botInstances: BotInstance[] = [];
    // Logger instance for consistent logging across the application
    private readonly logger = Logger.getInstance();
    // Configuration settings for the bot manager
    private readonly config: IConfig = {
        logInterval: 600000, // 10 minutes - interval for status logging
        maxRetries: 3,       // Maximum number of retries for failed operations
        retryDelay: 5000     // 5 seconds - delay between retries
    };

    constructor() {
        this.setupLogging();
    }

    /**
     * Creates a new Telegram bot and updates its API key in the database.
     * @param bot_id - The unique identifier for the bot
     * @param bot_name - The display name for the bot
     * @throws Error if bot creation or database update fails
     */
    private async createBot(bot_id: string, bot_name: string): Promise<void> {
        try {
            // Validate and get environment configuration
            const config = validateEnvironment();
            
            // Initialize Telegram client with environment variables
            const telegramClient = new TelegramClientService(
                config.apiId,
                config.apiHash,
                config.phoneNumber
            );

            // Start the Telegram client and create the bot
            await telegramClient.start();
            const api_key = await telegramClient.createBot(bot_id, bot_name);
            this.logger.info('Bot created', { bot_id, api_key });

            // Update the bot's API key in the database
            await SupabaseService.updateBotApiKey(bot_id, api_key);
        } catch (error) {
            this.logger.error('Error creating bot:', error);
            throw error;
        }
    }

    /**
     * Sets up periodic logging of bot status
     */
    private setupLogging(): void {
        setInterval(() => {
            this.logBotStatus();
        }, this.config.logInterval);
    }

    /**
     * Logs the current status of all bots, including active instances and configured bots
     */
    private async logBotStatus(): Promise<void> {
        const bots = await SupabaseService.getBotsConfig();
        this.logger.info('Bot Status', {
            activeInstances: this.botInstances.length,
            configuredBots: bots?.map(bot => bot.displayname)
        });
    }

    /**
     * Adds a new bot instance to the manager and initializes it
     * @param botConfig - Configuration for the bot to be added
     * @throws Error if bot initialization fails
     */
    private async addBot(botConfig: BotConfig): Promise<void> {
        try {
            // Create new Telegram bot instance with polling enabled
            const bot = new TelegramBot(botConfig.api_key, { polling: true });
            // Create bot instance wrapper with handlers
            const botInstance = new BotInstance(bot, botConfig);
            // Add to active instances
            this.botInstances.push(botInstance);
            // Start the bot instance
            await botInstance.start();
            // Initialize AI service for the bot
            await AIService.initialize(process.env.GOOGLE_API_KEY || '');
            this.logger.info('Bot added successfully', { botName: botConfig.displayname });
        } catch (error) {
            this.logger.error(`Error adding bot ${botConfig.displayname}:`, error);
            throw error;
        }
    }

    /**
     * Starts the bot manager and initializes all configured bots
     * @throws Error if initialization fails
     */
    public async start(): Promise<void> {
        this.logger.info('Starting bot manager...');
        try {
            // Get all bot configurations from the database
            const bots = await SupabaseService.getBotsConfig();
            if (!bots || bots.length === 0) {
                this.logger.warn('No bots found in configuration');
                return;
            }

            // Start existing bots (those with valid API keys)
            await Promise.all(
                bots
                    .filter(bot => bot.api_key !== 'tbc')
                    .map(bot => this.addBot(bot))
            );

            // Create and start new bots (those with 'tbc' API key)
            await Promise.all(
                bots
                    .filter(bot => bot.api_key === 'tbc')
                    .map(bot => this.createBot(bot.name, bot.displayname))
            );

            this.logger.info('Bot manager started successfully');
        } catch (error) {
            this.logger.error('Error starting bot manager:', error);
            throw error;
        }
    }

    /**
     * Cleans up all bot instances and resources
     */
    public cleanup(): void {
        this.logger.info('Cleaning up bot instances...');
        // Stop all bot instances
        this.botInstances.forEach(instance => instance.stop());
        // Clear the instances array
        this.botInstances.length = 0;
    }
}

/**
 * Main application entry point
 * Sets up the bot manager and handles process termination
 */
async function main() {
    const logger = Logger.getInstance();
    try {
        // Create and start the bot manager
        const botManager = new TelegramBotManager();
        await botManager.start();

        // Handle graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT. Cleaning up...');
            botManager.cleanup();
            process.exit(0);
        });

        // Handle graceful shutdown on SIGTERM
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM. Cleaning up...');
            botManager.cleanup();
            process.exit(0);
        });
    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}

// Start the application
main();





