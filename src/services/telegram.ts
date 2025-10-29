import TelegramBot, { SendMessageOptions } from "node-telegram-bot-api";
import { Option } from "./chatbot";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
// Create a bot instance
const token = process.env.BOT_TOKEN as string | undefined;
if (!token) {
  console.error("BOT_TOKEN is not set in .env");
  process.exit(1);
}

export interface UserState {
  currentStep: string;
  chatbotId: string;
}
export const userStates = new Map<number, UserState>();

export const bot = new TelegramBot(token, { polling: true });

// Helper function to create keyboard markup from options
export function createKeyboard(
  options?: Option[]
): SendMessageOptions | undefined {
  if (!options) return undefined;
  return {
    reply_markup: {
      inline_keyboard: options.map((option) => [{ text: option.text, callback_data: option.payload }]),
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}
