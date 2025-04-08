"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramClientService = void 0;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const readline_1 = __importDefault(require("readline"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Sleep function to add delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class TelegramClientService {
    constructor(apiId, apiHash, phoneNumber) {
        this.apiId = apiId;
        this.apiHash = apiHash;
        this.phoneNumber = phoneNumber;
        this.client = null;
    }
    async createBot(username, botname) {
        if (!this.client) {
            throw new Error('Client is not initialized. Call start() first.');
        }
        console.log('Bot creation started');
        try {
            await this.client.sendMessage("botFather", { message: `/start` });
            await sleep(2000);
            await this.client.sendMessage("botFather", { message: `/newbot` });
            await sleep(2000);
            await this.client.sendMessage("botFather", { message: `${botname}` });
            await sleep(2000);
            await this.client.sendMessage("botFather", { message: `${username}` });
            await sleep(2000);
            const messages = await this.client.getMessages("botFather", { limit: 1 });
            const index = messages[0].message.search(/\d{10}:\w{35}/g);
            const token = messages[0].message.substring(index, index + 46);
            return token;
        }
        catch (error) {
            console.error('Error creating bot:', error);
            throw error;
        }
    }
    async sendMessage(username, message) {
        if (!this.client) {
            throw new Error('Client is not initialized. Call start() first.');
        }
        try {
            await this.client.sendMessage(username, { message });
            console.log('Message sent successfully');
        }
        catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
    async loadExistingSession() {
        try {
            if (fs_1.default.existsSync(TelegramClientService.SESSION_FILE)) {
                const savedSession = fs_1.default.readFileSync(TelegramClientService.SESSION_FILE, 'utf-8').trim();
                if (savedSession) {
                    console.log('Found existing session, attempting to use it...');
                    return savedSession;
                }
            }
        }
        catch (error) {
            console.error('Error loading session:', error);
        }
        return undefined;
    }
    async createNewSession(rl) {
        this.client = new telegram_1.TelegramClient(new sessions_1.StringSession(""), this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
        await this.client.start({
            phoneNumber: this.phoneNumber,
            phoneCode: async () => new Promise((resolve) => rl.question("Please enter the code you received: ", resolve)),
            onError: (err) => console.log(err),
        });
        console.log("You should now be connected.");
        // @ts-ignore - The type definitions seem to be incorrect
        const newSessionKey = this.client.session.save();
        try {
            fs_1.default.writeFileSync(TelegramClientService.SESSION_FILE, newSessionKey);
            console.log('Session saved successfully');
        }
        catch (error) {
            console.error('Error saving session:', error);
        }
        return newSessionKey;
    }
    async connectWithSession(sessionKey) {
        this.client = new telegram_1.TelegramClient(new sessions_1.StringSession(sessionKey), this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
        await this.client.connect();
        console.log('Successfully connected with existing session');
    }
    async start() {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const sessionKey = await this.loadExistingSession();
        if (!sessionKey) {
            await this.createNewSession(rl);
        }
        else {
            await this.connectWithSession(sessionKey);
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }
}
exports.TelegramClientService = TelegramClientService;
TelegramClientService.SESSION_FILE = path_1.default.join(process.cwd(), 'telegram-session.txt');
