import TelegramBot from "node-telegram-bot-api";
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
export const userStates = new Map<number, { currentStep: string }>();

export const bot = new TelegramBot(token, { polling: true });

// Helper function to create keyboard markup from options
export function createKeyboard(options?: Option[]) {
  if (!options) return undefined;
  return {
    reply_markup: {
      keyboard: options.map((option) => [{ text: option.text, }]),
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}
