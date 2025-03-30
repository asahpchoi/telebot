import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Types for our database tables
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
  message: string;
  response: string;
  created_at: string;
}

export interface UploadedPhoto {
  id: string;
  chat_id: string;
  photo_url: string;
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);



// Bot configuration functions
export async function getBotConfig(id: string): Promise<BotConfig | null> {
  const { data, error } = await supabase
    .from('bot_configs')
    .select('*')
    .eq('id', id);


  if (error) {
    console.error('Error fetching bot config:', error);
    return null;
  }

  return data[0];
}

export async function getBotsConfig(): Promise<BotConfig[] | null> {
  const { data, error } = await supabase
    .from('bot_configs')
    .select('*');


  if (error) {
    console.error('Error fetching bot config:', error);
    return null;
  }

  return data;
}

export async function getChatHistory(chat_id: string): Promise<ChatHistory[]> {
  const { data, error } = await supabase
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

export async function saveChatHistory(
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

export async function getUploadPhotos(chat_id: string, bot_id: string): Promise<UploadedPhoto[]> {
  const { data, error } = await supabase
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
