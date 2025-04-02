"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const supabase_1 = require("./services/supabase");
const ai_1 = require("./services/ai");
const messageHandler_1 = require("./handlers/messageHandler");
class TelegramBotManager {
    constructor() {
        this.botInstances = [];
        this.LOG_INTERVAL = 600000; // 10 seconds
        this.setupLogging();
        this.messageHandler = new messageHandler_1.MessageHandler();
        this.google_api_key = process.env.GOOGLE_API_KEY || '';
    }
    setupLogging() {
        setInterval(() => {
            this.logBotStatus();
        }, this.LOG_INTERVAL);
    }
    async logBotStatus() {
        console.log('Current bot instances:', this.botInstances.length);
        const bots = await supabase_1.SupabaseService.getBotsConfig();
        console.log('Configured bots:', bots?.map(bot => bot.displayname).join(', '));
    }
    setupBotHandlers(bot, botConfig) {
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
        bot.on('polling_error', (error) => {
            console.error('Polling error:', error);
        });
    }
    async addBot(botConfig) {
        try {
            const bot = new node_telegram_bot_api_1.default(botConfig.api_key, { polling: true });
            this.botInstances.push(bot);
            this.setupBotHandlers(bot, botConfig);
            await ai_1.AIService.initialize(this.google_api_key);
            console.log('Bot added:', botConfig.displayname);
        }
        catch (error) {
            console.error(`Error adding bot ${botConfig.displayname}:`, error);
        }
    }
    async start() {
        console.log('Starting bot manager...');
        try {
            const bots = await supabase_1.SupabaseService.getBotsConfig();
            if (!bots || bots.length === 0) {
                console.error('No bots found in configuration');
                return;
            }
            await Promise.all(bots.map(bot => this.addBot(bot)));
            console.log('All bots started successfully');
        }
        catch (error) {
            console.error('Error starting bots:', error);
        }
    }
    cleanup() {
        console.log('Cleaning up bot instances...');
        this.botInstances.forEach(bot => {
            try {
                bot.close();
            }
            catch (error) {
                console.error('Error closing bot:', error);
            }
        });
        this.botInstances = [];
    }
}
async function main() {
    try {
        /*
        // Initialize Telegram client
        const config = validateEnvironment();
        const telegramClient = new TelegramClientService(
            config.apiId,
            config.apiHash,
            config.phoneNumber
        );
        // Start Telegram client
        await telegramClient.start();
        await telegramClient.createBot("avatar33323bot", "Asa Choi");
        */
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
    }
    catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}
main();
