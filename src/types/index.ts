import { Message } from 'node-telegram-bot-api';
import TelegramBot from 'node-telegram-bot-api';

export interface BotConfig {
    id: string;
    name: string;
    api_key: string;
    system_prompt: string;
    created_at: string;
    updated_at: string;
}

export interface ChatHistory {
    id: string;
    bot_id: string;
    user_id: string;
    chat_id: string;
    message: string;
    response: string;
    created_at: string;
}

export interface UploadedPhoto {
    id: string;
    bot_id: string;
    chat_id: string;
    photo_url: string;
    created_at: string;
}

export interface BotMessageHandler {
    handleMessage(bot: TelegramBot, msg: Message, botConfig: BotConfig): Promise<void>;
    handleImageCommand(bot: TelegramBot, chatId: number, botId: string): Promise<void>;
} 