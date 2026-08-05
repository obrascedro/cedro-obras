import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave em .env.local."
    );
  }

  return new OpenAI({ apiKey });
}
