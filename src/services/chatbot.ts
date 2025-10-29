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

console.log(
  `Loaded conversation config with ${conversationConfig.steps.length} steps`
);

// Helper function to find step by ID
export function findStep(stepId: string): Step | undefined {
  const found = conversationConfig.steps.find((step) => step.id === stepId);
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
    try {
      await bot.sendMessage(
        chatId,
        "Sorry we have trouble responding your message"
      );
    } catch (sendErr) {
      console.error(
        "handleAction: failed to send error message to user",
        sendErr
      );
    }
  }
}

export async function handleNextStep(chatId: number, nextStep: Step) {
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

  userStates.set(chatId, { currentStep: nextStep.id });
  console.log(
    `handleNextStep: userStates updated for chat=${chatId} -> '${nextStep.id}'`
  );

  if (photo) {
    console.log(`handleNextStep: sending photo to chat=${chatId} -> ${photo}`);
    try {
      await bot.sendPhoto(chatId, photo);
      console.log("handleNextStep: photo sent");
    } catch (err) {
      console.error("handleNextStep: failed to send photo", err);
    }
  }

  if (video) {
    console.log(`handleNextStep: sending video to chat=${chatId} -> ${video}`);
    try {
      await bot.sendVideo(chatId, video);
      console.log("handleNextStep: video sent");
    } catch (err) {
      console.error("handleNextStep: failed to send video", err);
    }
  }

  if (document) {
    console.log(
      `handleNextStep: sending document to chat=${chatId} -> ${document}`
    );
    try {
      await bot.sendDocument(chatId, document);
      console.log("handleNextStep: document sent");
    } catch (err) {
      console.error("handleNextStep: failed to send document", err);
    }
  }

  try {
    await bot.sendMessage(
      chatId,
      nextStep.message,
      createKeyboard(nextStep.options)
    );
    console.log(`handleNextStep: message sent to chat=${chatId}`);
  } catch (err) {
    console.error("handleNextStep: failed to send message", err);
  }
}
