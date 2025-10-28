import TelegramBot, { Message } from "node-telegram-bot-api";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

type Option = { text: string; nextStep: string };
type Step = {
  id: string;
  message: string;
  options: Option[];
  header?: {
    photo?: string;
    video?: string;
    document?: string;
  };
};
type Conversation = { steps: Step[] };

// Read conversation flow from JSON
const conversationConfig: Conversation = JSON.parse(
  fs.readFileSync(path.join(__dirname, "config", "conversation.json"), "utf8")
);

// Create a bot instance
const token = process.env.BOT_TOKEN as string | undefined;
if (!token) {
  console.error("BOT_TOKEN is not set in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Store user states
const userStates = new Map<number, { currentStep: string }>();

// Helper function to find step by ID
function findStep(stepId: string): Step | undefined {
  return conversationConfig.steps.find((step) => step.id === stepId);
}

// Helper function to create keyboard markup from options
function createKeyboard(options: Option[]) {
  return {
    reply_markup: {
      keyboard: options.map((option) => [{ text: option.text }]),
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
}

// Handle /start command
bot.onText(/\/start/, (msg: Message) => {
  const chatId = msg.chat.id;
  const startStep = findStep("start");
  if (!startStep) return;

  userStates.set(chatId, { currentStep: "start" });

  bot.sendMessage(chatId, startStep.message, createKeyboard(startStep.options));
});

// Handle all messages
bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  const userState = userStates.get(chatId);

  // Ignore if no state (user hasn't started) or it's a /start command
  if (!userState || msg.text === "/start") return;

  const currentStep = findStep(userState.currentStep);
  if (!currentStep) return;

  // Find the selected option
  const selectedOption = currentStep.options.find(
    (option) => option.text === msg.text
  );

  if (selectedOption) {
    const nextStep = findStep(selectedOption.nextStep);

    if (nextStep) {
      const { photo, video, document } = nextStep.header ?? {};

      userStates.set(chatId, { currentStep: nextStep.id });

      if (photo) {
        await bot.sendPhoto(chatId, photo);
      }

      if (video) {
        await bot.sendVideo(chatId, video);
      }

      if (document) {
        await bot.sendDocument(chatId, document);
      }

      bot.sendMessage(
        chatId,
        nextStep.message,
        createKeyboard(nextStep.options)
      );
    } else {
      bot.sendMessage(
        chatId,
        "Next step not found.",
        createKeyboard(currentStep.options)
      );
    }
  } else {
    // Handle invalid input
    bot.sendMessage(
      chatId,
      "Please select one of the available options.",
      createKeyboard(currentStep.options)
    );
  }
});

console.log("TypeScript bot is running...");
