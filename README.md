# Telegram Bot Manager

A TypeScript application that allows you to manage multiple Telegram bots with AI-powered responses and image handling capabilities.

## Features

- **Multiple Bot Management**: Run and manage multiple Telegram bots from a single application
- **AI-Powered Responses**: Uses Google's Gemini AI for intelligent responses
- **Persistent Chat History**: Stores conversation history in Supabase for context-aware responses
- **Image Handling**: Command to display images that have been uploaded
- **Automatic Cleanup**: Proper resource management and cleanup on termination
- **Logging**: Regular status updates on active bots

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account and project
- Telegram Bot Token(s) (from [@BotFather](https://t.me/botfather))
- Google Gemini API key

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the following tables in your Supabase database:

   ### Bot Configurations

   ```sql
   create table bot_configs (
     id text primary key,
     name text not null,
     api_key text not null,
     system_prompt text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

   ### Chat History

   ```sql
   create table chat_history (
     id uuid default uuid_generate_v4() primary key,
     bot_id text references bot_configs(id),
     user_id text not null,
     chat_id text not null,
     message text not null,
     response text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

   ### Uploaded Photos

   ```sql
   create table get_images (
     id uuid default uuid_generate_v4() primary key,
     bot_id text references bot_configs(id),
     chat_id text not null,
     photo_url text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

5. Add your Telegram bot configurations to the `bot_configs` table:
   ```sql
   insert into bot_configs (id, name, api_key, system_prompt)
   values (
     'bot-1',
     'My First Bot',
     'YOUR_TELEGRAM_BOT_TOKEN',
     'You are a helpful assistant.'
   );
   ```

## Running the Bot

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Bot Commands

- `/image` - Displays all images that have been uploaded for the current chat

## Architecture

- **TelegramBotManager**: Main class that manages all bot instances
- **Supabase Integration**: Handles data persistence for bot configuration, chat history, and uploads
- **Google Gemini AI**: Provides intelligent responses to user messages

## Error Handling

The application includes comprehensive error handling for:
- Bot initialization
- Message processing
- Image handling
- Database operations

## License

MIT
