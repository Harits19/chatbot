import { Message } from "node-telegram-bot-api";

import {
  Conversation,
  findConfigById,
  findConfigByTrigger,
  findStep,
  handleEmptySession,
  handleNextStep,
} from "./services/chatbot";
import { bot, createKeyboard, userStates } from "./services/telegram";

// Handle all messages
bot.on("message", async (msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text ?? "<no-text>";

  console.log(`Incoming message from chat=${chatId}: ${text}`);

  const userState = userStates.get(chatId);

  if (!userState) {
    await handleEmptySession(chatId, text);
    return;
  }

  const conversation = findConfigById(userState.chatbotId);
  if (!conversation) {
    console.warn(
      `No conversation config found for chatbotId='${userState.chatbotId}' chat=${chatId}`
    );
    await bot.sendMessage(chatId, "No conversation config found");
    return;
  }

  console.log(
    `Resuming conversation chat=${chatId} chatbotId='${conversation.id}'`
  );

  console.log(`chat=${chatId} currentStep='${userState.currentStep}'`);

  const currentStep = findStep(userState.currentStep, conversation);
  if (!currentStep) {
    console.warn(
      `chat=${chatId} currentStep='${userState.currentStep}' not found in config`
    );
    return;
  }

  // Find the selected option
  const selected = currentStep.options?.find(
    (option) => option.text === msg.text
  );
  const nextStepId = selected?.nextStep ?? currentStep.nextStep;

  console.log(
    `chat=${chatId} selectedOption='${selected?.text ?? "none"}' nextStepId='${
      nextStepId ?? "none"
    }'`
  );

  if (nextStepId) {
    const nextStep = findStep(nextStepId, conversation);

    if (nextStep) {
      console.log(`chat=${chatId} -> executing nextStep='${nextStepId}'`);
      try {
        const start = Date.now();
        await handleNextStep(chatId, nextStep, conversation);
        const duration = Date.now() - start;
        console.log(
          `chat=${chatId} -> nextStep='${nextStepId}' handled successfully in ${duration}ms`
        );
      } catch (err) {
        console.error(
          `chat=${chatId} -> error handling nextStep='${nextStepId}'`,
          err
        );
        try {
          await bot.sendMessage(
            chatId,
            "An error occurred while processing your request."
          );
        } catch {}
      }
    } else {
      console.warn(`chat=${chatId} nextStepId='${nextStepId}' not found`);
      bot.sendMessage(
        chatId,
        "Next step not found.",
        createKeyboard(currentStep.options)
      );
    }
  } else {
    // Handle invalid input
    console.log(`chat=${chatId} invalid input: '${text}'`);
    bot.sendMessage(
      chatId,
      "Please select one of the available options.",
      createKeyboard(currentStep.options)
    );
  }
});

console.log("TypeScript bot is running...");
