import TelegramBot, { Message } from 'node-telegram-bot-api';
import { BotConfig, BotMessageHandler } from '../types';
import { AIService } from '../services/ai';
import { SupabaseService } from '../services/supabase';

export class MessageHandler implements BotMessageHandler {
    async handleMessage(bot: TelegramBot, msg: Message, botConfig: BotConfig): Promise<void> {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Ignore commands
        if (text?.startsWith('/')) {
            return;
        }

        try {
            const currentConfig = await SupabaseService.getBotConfig(botConfig.id);
            const systemPrompt = currentConfig?.system_prompt || botConfig.system_prompt;

            if (text) {
                const answer = await AIService.ask(text, systemPrompt);
                await bot.sendMessage(chatId, answer);
                const chat = await bot.getChat(chatId);
                console.log({chat});
                
                // Get a user identifier - username if available, otherwise use first_name or chat ID
                const userId = chat.username || 
                               chat.first_name || 
                               chat.title || 
                               chatId.toString();
                
                await SupabaseService.saveChatHistory(
                    botConfig.id,
                    userId,
                    chatId.toString(),
                    text,
                    answer
                );
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your message.');
        }
    }

    async handleImageCommand(bot: TelegramBot, chatId: number, botId: string): Promise<void> {
        try {
            const chat = await bot.getChat(chatId);
            console.log({bot});
            const photos = await SupabaseService.getUploadPhotos(chatId.toString(), botId);
            console.log({photos});
            
            if (photos.length === 0) {
                await bot.sendMessage(chatId, "No uploaded photos found.");
                return;
            }
            
            for (const photo of photos) {
                await bot.sendPhoto(chatId, photo.photo_url);
            }
        } catch (error) {
            console.error('Error handling image command:', error);
            await bot.sendMessage(chatId, "Error retrieving photos.");
        }
    }
} 