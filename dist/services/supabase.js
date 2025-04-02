"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
class SupabaseService {
    static async getBotsConfig() {
        const { data, error } = await exports.supabase
            .from('bot_configs')
            .select('*');
        if (error) {
            console.error('Error fetching bot configs:', error);
            return [];
        }
        return data || [];
    }
    static async getBotConfig(botId) {
        const { data, error } = await exports.supabase
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
    static async getChatHistory(botId, userId) {
        const { data, error } = await exports.supabase
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
    static async saveChatHistory(botId, userId, chatId, message, response) {
        const { error } = await exports.supabase
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
    static async getUploadPhotos(chatId, botId) {
        const { data, error } = await exports.supabase
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
}
exports.SupabaseService = SupabaseService;
