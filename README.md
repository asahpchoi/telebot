# Simple Telegram Bot

A simple Telegram bot built with Node.js and TypeScript that responds to messages and commands.

## Features

- Responds to `/start` command with a greeting
- Responds to `/help` command with available commands
- Echoes back any regular message it receives
- Error handling for polling issues

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Telegram Bot Token (get it from [@BotFather](https://t.me/botfather))

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Telegram bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
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

## Available Commands

- `/start` - Start the bot and get a greeting
- `/help` - Show available commands

## License

MIT #   t e l e b o t  
 