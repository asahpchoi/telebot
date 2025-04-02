"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getBotConfig = getBotConfig;
exports.getBotsConfig = getBotsConfig;
exports.getChatHistory = getChatHistory;
exports.saveChatHistory = saveChatHistory;
exports.getUploadPhotos = getUploadPhotos;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Bot configuration functions
async function getBotConfig(id) {
    const { data, error } = await exports.supabase
        .from('bot_configs')
        .select('*')
        .eq('id', id);
    if (error) {
        console.error('Error fetching bot config:', error);
        return null;
    }
    return data[0];
}
async function getBotsConfig() {
    const { data, error } = await exports.supabase
        .from('bot_configs')
        .select('*');
    if (error) {
        console.error('Error fetching bot config:', error);
        return null;
    }
    return data;
}
async function getChatHistory(chat_id) {
    const { data, error } = await exports.supabase
        .from('chat_history')
        .select('*')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: false })
        .limit(10);
    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }
    return data || [];
}
async function saveChatHistory(botId, userId, chatId, message, response) {
    const { error } = await exports.supabase
        .from('chat_history')
        .insert([
        {
            bot_id: botId,
            chat_id: chatId,
            user_id: userId,
            message,
            response,
        },
    ]);
    if (error) {
        console.error('Error saving chat history:', error);
    }
}
async function getUploadPhotos(chat_id, bot_id) {
    const { data, error } = await exports.supabase
        .from('get_images')
        .select('*')
        .eq('chat_id', chat_id)
        .eq('bot_id', bot_id);
    if (error) {
        console.error('Error fetching photos:', error);
        return [];
    }
    return data || [];
}
