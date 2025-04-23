"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const supabase_1 = require("./services/supabase");
const model_1 = require("./model");
const client_1 = require("./services/telegram/client");
const environment_1 = require("./config/environment");
const botInstance_1 = require("./services/botInstance");
const logger_1 = require("./services/logger");
/**
 * Main class responsible for managing multiple Telegram bots.
 * Implements the ITelegramBotManager interface to ensure consistent behavior.
 */
class TelegramBotManager {
    constructor() {
        // Store active bot instances
        this.botInstances = [];
        // Logger instance for consistent logging across the application
        this.logger = logger_1.Logger.getInstance();
        // Configuration settings for the bot manager
        this.config = {
            logInterval: 600000, // 10 minutes - interval for status logging
            maxRetries: 3, // Maximum number of retries for failed operations
            retryDelay: 5000 // 5 seconds - delay between retries
        };
        this.setupLogging();
    }
    /**
     * Creates a new Telegram bot and updates its API key in the database.
     * @param bot_id - The unique identifier for the bot
     * @param bot_name - The display name for the bot
     * @throws Error if bot creation or database update fails
     */
    async createBot(bot_id, bot_name) {
        try {
            // Validate and get environment configuration
            const config = (0, environment_1.validateEnvironment)();
            // Initialize Telegram client with environment variables
            const telegramClient = new client_1.TelegramClientService(config.apiId, config.apiHash, config.phoneNumber);
            // Start the Telegram client and create the bot
            await telegramClient.start();
            const api_key = await telegramClient.createBot(bot_id, bot_name);
            this.logger.info('Bot created', { bot_id, api_key });
            // Update the bot's API key in the database
            await supabase_1.SupabaseService.updateBotApiKey(bot_id, api_key);
        }
        catch (error) {
            this.logger.error('Error creating bot:', error);
            throw error;
        }
    }
    /**
     * Sets up periodic logging of bot status
     */
    setupLogging() {
        setInterval(() => {
            this.logBotStatus();
        }, this.config.logInterval);
    }
    /**
     * Logs the current status of all bots, including active instances and configured bots
     */
    async logBotStatus() {
        const bots = await supabase_1.SupabaseService.getBotsConfig();
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
    async addBot(botConfig) {
        try {
            // Create new Telegram bot instance with polling enabled
            const bot = new node_telegram_bot_api_1.default(botConfig.api_key, { polling: true });
            // Create bot instance wrapper with handlers
            const botInstance = new botInstance_1.BotInstance(bot, botConfig);
            // Add to active instances
            this.botInstances.push(botInstance);
            // Start the bot instance
            await botInstance.start();
            // Initialize AI service for the bot
            await model_1.AIService.initialize(process.env.GOOGLE_API_KEY || '');
            this.logger.info('Bot added successfully', { botName: botConfig.displayname });
        }
        catch (error) {
            this.logger.error(`Error adding bot ${botConfig.displayname}:`, error);
            throw error;
        }
    }
    /**
     * Starts the bot manager and initializes all configured bots
     * @throws Error if initialization fails
     */
    async start() {
        this.logger.info('Starting bot manager...');
        try {
            // Get all bot configurations from the database
            const bots = await supabase_1.SupabaseService.getBotsConfig();
            if (!bots || bots.length === 0) {
                this.logger.warn('No bots found in configuration');
                return;
            }
            // Start existing bots (those with valid API keys)
            await Promise.all(bots
                .filter(bot => bot.api_key !== 'tbc')
                .map(bot => this.addBot(bot)));
            // Create and start new bots (those with 'tbc' API key)
            await Promise.all(bots
                .filter(bot => bot.api_key === 'tbc')
                .map(bot => this.createBot(bot.name, bot.displayname)));
            this.logger.info('Bot manager started successfully');
        }
        catch (error) {
            this.logger.error('Error starting bot manager:', error);
            throw error;
        }
    }
    /**
     * Cleans up all bot instances and resources
     */
    cleanup() {
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
    const logger = logger_1.Logger.getInstance();
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
    }
    catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}
// Start the application
main();
