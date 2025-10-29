import axios, { AxiosRequestConfig } from "axios";
import path from "path";
import fs from "fs";
import { bot, createKeyboard, userStates } from "./telegram";
import { replaceObject } from "./variable";

export type Option = { text: string; nextStep: string };
export type Step = {
  id: string;
  message: string;
  options?: Option[];
  action: AxiosRequestConfig;
  header?: {
    photo?: string;
    video?: string;
    document?: string;
  };
};
export type Conversation = { steps: Step[] };
// Read conversation flow from JSON
export const conversationConfig: Conversation = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "config", "conversation.json"),
    "utf8"
  )
);

// Helper function to find step by ID
export function findStep(stepId: string): Step | undefined {
  return conversationConfig.steps.find((step) => step.id === stepId);
}

export async function handleNextStep(chatId: number, nextStep: Step) {
  const { photo, video, document } = nextStep.header ?? {};
  const action = nextStep.action;

  try {
    const response = await axios(action);
    nextStep = replaceObject(response, nextStep);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Sorry we have trouble responding your message ");
    return;
  }

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

  await bot.sendMessage(
    chatId,
    nextStep.message,
    createKeyboard(nextStep.options)
  );
}
