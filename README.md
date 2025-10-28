# Telegram Chatbot with JSON-based Conversation Flow

This is a Node.js-based Telegram chatbot that uses a JSON configuration file to manage conversation flow.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your bot:
- Create a Telegram bot using BotFather and get your bot token
- Copy your bot token to the `.env` file:
```
BOT_TOKEN=your_telegram_bot_token_here
```

3. Customize the conversation flow:
- Edit `src/config/conversation.json` to modify the conversation steps and flow
- Each step should have:
  - `id`: unique identifier for the step
  - `message`: text to show to the user
  - `options`: array of available options, each with:
    - `text`: button text to show
    - `nextStep`: ID of the next step

## Running the Bot (TypeScript)

Install dependencies (this will install TypeScript toolchain defined in devDependencies):
```bash
npm install
```

Development mode (with auto-reload using ts-node-dev):
```bash
npm run dev
```

Build to JavaScript and run (production):
```bash
npm run build
npm start
```

## Project Structure

- `src/index.js` - Main bot logic
- `src/config/conversation.json` - Conversation flow configuration
- `.env` - Environment variables