import { fetchDeepSeek, ChatMessage } from "@/lib/openrouter";

export const getAIResponse = async (messages: ChatMessage[]) => {
  try {
    const response = await fetchDeepSeek(messages);
    return response;
  } catch (error) {
    console.error("AI Fetch Error:", error);
    throw error;
  }
};
