import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import readline from "readline";
import fs from 'fs';
import path from 'path';
 

// Sleep function to add delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TelegramClientService {
    private static readonly SESSION_FILE = path.join(process.cwd(), 'telegram-session.txt');
    private client: TelegramClient | null = null;

    constructor(
        private readonly apiId: number,
        private readonly apiHash: string,
        private readonly phoneNumber: string
    ) {}

    public async createBot(username: string, botname: string): Promise<string> {
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
  
            const messages = await this.client.getMessages("botFather", {limit:1});
            const index = messages[0].message.search(/\d{10}:\w{35}/g);
            const token = messages[0].message.substring(index, index + 46);
      
            return token;
        } catch (error) {
            console.error('Error creating bot:', error);
            throw error;
        }
    }

    public async sendMessage(username: string, message: string): Promise<void> {
        if (!this.client) {
            throw new Error('Client is not initialized. Call start() first.');
        }

        try {
            await this.client.sendMessage(username, { message });
            console.log('Message sent successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    private async loadExistingSession(): Promise<string | undefined> {
        try {
            if (fs.existsSync(TelegramClientService.SESSION_FILE)) {
                const savedSession = fs.readFileSync(TelegramClientService.SESSION_FILE, 'utf-8').trim();
                if (savedSession) {
                    console.log('Found existing session, attempting to use it...');
                    return savedSession;
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
        return undefined;
    }

    private async createNewSession(rl: readline.Interface): Promise<string> {
        this.client = new TelegramClient(
            new StringSession(""),
            this.apiId,
            this.apiHash,
            {
                connectionRetries: 5,
            }
        );

        await this.client.start({
            phoneNumber: this.phoneNumber,
            phoneCode: async () =>
                new Promise((resolve) =>
                    rl.question("Please enter the code you received: ", resolve)
                ),
            onError: (err) => console.log(err),
        });
        console.log("You should now be connected.");

        // @ts-ignore - The type definitions seem to be incorrect
        const newSessionKey = this.client.session.save() as string;
        
        try {
            fs.writeFileSync(TelegramClientService.SESSION_FILE, newSessionKey);
            console.log('Session saved successfully');
        } catch (error) {
            console.error('Error saving session:', error);
        }

        return newSessionKey;
    }

    private async connectWithSession(sessionKey: string): Promise<void> {
        this.client = new TelegramClient(
            new StringSession(sessionKey),
            this.apiId,
            this.apiHash,
            {
                connectionRetries: 5,
            }
        );
        await this.client.connect();
        console.log('Successfully connected with existing session');
    }

    public async start(): Promise<void> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const sessionKey = await this.loadExistingSession();

        if (!sessionKey) {
            await this.createNewSession(rl);
        } else {
            await this.connectWithSession(sessionKey);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }
} 