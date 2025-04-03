import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BotConfig, ChatHistory, UploadedPhoto } from '../types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
    static async getBotsConfig(): Promise<BotConfig[]> {
        const { data, error } = await supabase
            .from('bot_configs')
            .select('*');

        if (error) {
            console.error('Error fetching bot configs:', error);
            return [];
        }

        return data || [];
    }

    static async getBotConfig(botId: string): Promise<BotConfig | null> {
        const { data, error } = await supabase
            .from('bot_configs')
            .select('*')
            .eq('id', botId)
            .single();

        if (error) {
            console.error('Error fetching bot config:', error);
            return null;
        }

        return data;
    }

    static async getChatHistory(botId: string, userId: string): Promise<ChatHistory[]> {
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('bot_id', botId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }

        return data || [];
    }

    static async saveChatHistory(
        botId: string,
        userId: string,
        chatId: string,
        message: string,
        response: string
    ): Promise<void> {
        const { error } = await supabase
            .from('chat_history')
            .insert([
                {
                    bot_id: botId,
                    user_id: userId,
                    chat_id: chatId,
                    message,
                    response,
                },
            ]);

        if (error) {
            console.error('Error saving chat history:', error);
        }
    }

    static async getUploadPhotos(chatId: string, botId: string): Promise<UploadedPhoto[]> {
        const { data, error } = await supabase
            .from('get_images')
            .select('*')
            .eq('chat_id', chatId)
            .eq('bot_id', botId);

        if (error) {
            console.error('Error fetching photos:', error);
            return [];
        }

        return data || [];
    }

    static async updateBotApiKey(botId: string, apiKey: string): Promise<void> {
        const { error } = await supabase
            .from('bot_configs')
            .update({ api_key: apiKey })
            .eq('name', botId);

        if (error) {
            console.error('Error updating bot API key:', error);
            throw error;
        }
    }
} 