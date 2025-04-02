"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const ai_1 = require("../services/ai");
const supabase_1 = require("../services/supabase");
class MessageHandler {
    async handleMessage(bot, msg, botConfig) {
        const chatId = msg.chat.id;
        const text = msg.text;
        // Ignore commands
        if (text?.startsWith('/')) {
            return;
        }
        try {
            const currentConfig = await supabase_1.SupabaseService.getBotConfig(botConfig.id);
            const systemPrompt = currentConfig?.system_prompt || botConfig.system_prompt;
            const displayName = currentConfig?.displayname || botConfig.displayname;
            if (text) {
                const answer = await ai_1.AIService.ask(text, systemPrompt);
                await bot.sendMessage(chatId, answer);
                const chat = await bot.getChat(chatId);
                console.log({ chat });
                // Get a user identifier - username if available, otherwise use first_name or chat ID
                const userId = chat.username ||
                    chat.first_name ||
                    chat.title ||
                    chatId.toString();
                await supabase_1.SupabaseService.saveChatHistory(botConfig.id, userId, chatId.toString(), text, answer);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            await bot.sendMessage(chatId, 'Sorry, I encountered an error processing your message.');
        }
    }
    async handleImageCommand(bot, chatId, botId) {
        try {
            const chat = await bot.getChat(chatId);
            const botConfig = await supabase_1.SupabaseService.getBotConfig(botId);
            const displayName = botConfig?.displayname || 'Bot';
            const photos = await supabase_1.SupabaseService.getUploadPhotos(chatId.toString(), botId);
            console.log({ photos });
            if (photos.length === 0) {
                await bot.sendMessage(chatId, `${displayName} hasn't uploaded any photos yet.`);
                return;
            }
            await bot.sendMessage(chatId, `${displayName} is showing you the uploaded photos:`);
            for (const photo of photos) {
                await bot.sendPhoto(chatId, photo.photo_url);
            }
        }
        catch (error) {
            console.error('Error handling image command:', error);
            await bot.sendMessage(chatId, "Error retrieving photos.");
        }
    }
}
exports.MessageHandler = MessageHandler;
