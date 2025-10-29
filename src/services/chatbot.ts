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
  nextStep?: string;
  action: AxiosRequestConfig;
  endJourney?: boolean;
  header?: {
    photo?: string;
    video?: string;
    document?: string;
  };
};
export type Conversation = { steps: Step[]; trigger: string[]; id: string };
// Read conversation flow from JSON
export const conversationConfig: Conversation[] = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "config", "conversation.json"),
    "utf8"
  )
);

console.log(
  `Loaded conversation config with ${conversationConfig.length} chatbot`
);

export function findConfigByTrigger(trigger: string) {
  return conversationConfig.find((item) => item.trigger.includes(trigger));
}

export function findConfigById(id: string) {
  return conversationConfig.find((item) => item.id === id);
}

// Helper function to find step by ID
export function findStep(
  stepId: string,
  conversation: Conversation
): Step | undefined {
  const found = conversation.steps.find((step) => step.id === stepId);
  console.log(`findStep: '${stepId}' -> ${found ? "found" : "not found"}`);
  return found;
}

async function handleAction(chatId: number, nextStep: Step) {
  const action = nextStep.action;

  if (!action) {
    throw new Error("Empty action value");
  }

  try {
    console.log(
      `handleAction: chat=${chatId} calling ${action.method ?? "GET"} ${
        action.url ?? ""
      }`
    );
    const response = await axios(action);
    console.log(`handleAction: received status=${response.status}`);
    nextStep = replaceObject(response, nextStep);
    console.log(`handleAction: nextStep after replace -> id='${nextStep.id}'`);
    return nextStep;
  } catch (error) {
    console.error("handleAction: error", error);
    await bot.sendMessage(
      chatId,
      "Sorry we have trouble responding your message"
    );
  }
}

export async function handleNextStep(
  chatId: number,
  nextStep: Step,
  conversation: Conversation
) {
  const { photo, video, document } = nextStep.header ?? {};

  console.log(`handleNextStep: chat=${chatId} nextStepId='${nextStep.id}'`);

  if (nextStep.action) {
    console.log(
      `handleNextStep: step has action, executing action for chat=${chatId}`
    );
    const result = await handleAction(chatId, nextStep);
    if (!result) {
      console.warn(
        `handleNextStep: action returned no result for chat=${chatId}`
      );
      return;
    }
    nextStep = result;
  }

  userStates.set(chatId, {
    currentStep: nextStep.id,
    chatbotId: conversation.id,
  });
  console.log(
    `handleNextStep: userStates updated for chat=${chatId} -> '${nextStep.id}'`
  );

  if (photo) {
    console.log(`handleNextStep: sending photo to chat=${chatId} -> ${photo}`);
    await bot.sendPhoto(chatId, photo);
    console.log("handleNextStep: photo sent");
  }

  if (video) {
    console.log(`handleNextStep: sending video to chat=${chatId} -> ${video}`);
    await bot.sendVideo(chatId, video);
    console.log("handleNextStep: video sent");
  }

  if (document) {
    console.log(
      `handleNextStep: sending document to chat=${chatId} -> ${document}`
    );
    await bot.sendDocument(chatId, document);
    console.log("handleNextStep: document sent");
  }

  await bot.sendMessage(
    chatId,
    nextStep.message,
    createKeyboard(nextStep.options)
  );
  console.log(`handleNextStep: message sent to chat=${chatId}`);

  if (nextStep.endJourney === true) {
    userStates.delete(chatId);
  }
}

export async function handleEmptySession(chatId: number, text: string) {
  console.log(
    `No conversation state for chat=${chatId}. Start new conversation.`
  );
  const conversation = findConfigByTrigger(text);
  if (!conversation) {
    console.warn(
      `No conversation config found for trigger='${text}' chat=${chatId}`
    );
    await bot.sendMessage(chatId, "No conversation config found");
    return;
  }

  const newUserState = {
    chatbotId: conversation.id,
    currentStep: "start",
  };

  const nextStep = findStep(newUserState.currentStep, conversation);

  if (!nextStep) {
    console.error("step with id start not found");
    return;
  }

  userStates.set(chatId, newUserState);
  console.log(
    `Saved new userState for chat=${chatId} chatbotId='${conversation.id}' currentStep='start'`
  );

  await handleNextStep(chatId, nextStep, conversation);
}
