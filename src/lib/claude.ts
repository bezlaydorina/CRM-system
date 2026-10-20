import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export type AssistantMessage = { role: "user" | "assistant"; text: string };

/**
 * Nélkül (ANTHROPIC_API_KEY hiányában) null-t ad vissza, így a hívó fél a
 * meglévő szabályalapú válaszadóra eshet vissza, soha nem dob hibát.
 */
export async function askClaude({
  system,
  history,
}: {
  system: string;
  history: AssistantMessage[];
}): Promise<string | null> {
  if (!client) {
    console.warn("[claude] ANTHROPIC_API_KEY nincs beállítva – szabályalapú válaszadóra esünk vissza.");
    return null;
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system,
      messages: history.map((m) => ({ role: m.role, content: m.text })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text ?? null;
  } catch (error) {
    console.error("[claude] Hívás sikertelen, szabályalapú válaszadóra esünk vissza:", error);
    return null;
  }
}
