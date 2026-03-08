export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const fetchDeepSeek = async (messages: ChatMessage[]) => {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received.";
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw error;
  }
};
