"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotInstance = void 0;
const messageHandler_1 = require("../handlers/messageHandler");
const logger_1 = require("./logger");
class BotInstance {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.logger = logger_1.Logger.getInstance();
        this.messageHandler = new messageHandler_1.MessageHandler();
        this.setupHandlers();
    }
    setupHandlers() {
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
        this.bot.on('polling_error', (error) => {
            this.logger.error('Polling error:', error);
        });
    }
    async start() {
        try {
            this.logger.info(`Starting bot: ${this.config.displayname}`);
            // Additional startup logic if needed
        }
        catch (error) {
            this.logger.error(`Error starting bot ${this.config.displayname}:`, error);
            throw error;
        }
    }
    stop() {
        try {
            this.bot.close();
            this.logger.info(`Stopped bot: ${this.config.displayname}`);
        }
        catch (error) {
            this.logger.error(`Error stopping bot ${this.config.displayname}:`, error);
        }
    }
}
exports.BotInstance = BotInstance;
