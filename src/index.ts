import { Message } from "node-telegram-bot-api";

import { findStep, handleNextStep } from "./services/chatbot";
import { bot, createKeyboard, userStates } from "./services/telegram";

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
  const selectedOption = currentStep.options?.find(
    (option) => option.text === msg.text
  );

  if (selectedOption) {
    const nextStep = findStep(selectedOption.nextStep);

    if (nextStep) {
      await handleNextStep(chatId, nextStep);
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
