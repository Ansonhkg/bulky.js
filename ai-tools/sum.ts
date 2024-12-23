import fs from "fs/promises";
import { AutoTokenizer } from "@huggingface/transformers";

// Configurable constants
const CONFIG = {
  API_PROVIDER: "lm-studio", // "lm-studio" or "openai"
  LM_STUDIO_URL: "http://localhost:1234/v1/chat/completions", // LM Studio base URL
  OPENAI_API_URL: "https://api.openai.com/v1/chat/completions", // OpenAI API base URL
  OPENAI_API_KEY: process.env.OPENAI_API_KEY, // OpenAI API key
  INPUT_DIR: "./ai-dist/bulkie", // Input directory
  OUTPUT_FILE: "./ai-dist/bulkie/combinedOutput.txt", // Output file path
  MODEL: "llama-3.3-70b-instruct", // Model to use OpenAI: gpt-4o-mini, llama-3.3-70b-instruct
  MAX_RESPONSE_TOKEN: 3000, // Max response size
  MAX_TOKENS: 30000, // Max tokens per chunk or response
  TOKENIZER_MODEL: "bert-base-uncased", // Tokenizer model
  CHUNK_OVERLAP: 0, // Overlap between chunks for context preservation
  PROCESS_MODE: "hierarchical", // "single-pass" or "hierarchical"
  CHUNK_PROMPT: "Analyze the following text and provide a structured summary with key points:\n\n", // Industrial standard chunk prompt
  FINAL_PROMPT: "Summarise and refine the following content for a cohesive output, explain why it is a composable layer SDK and who things are modular. Give some example on the usage for the following: \n\n", // Final prompt for refinement
};

/**
 * Tokenizes and chunks text into manageable parts with optional overlap.
 * @param text - The input text to be chunked.
 * @param maxTokens - Maximum number of tokens allowed per chunk.
 * @param overlap - Number of tokens to overlap between chunks.
 * @returns Array of text chunks.
 */
async function chunkTextWithOverlap(text: string, maxTokens: number, overlap: number): Promise<string[]> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Input text is invalid or empty.");
  }

  const tokenizer = await AutoTokenizer.from_pretrained(CONFIG.TOKENIZER_MODEL);

  const tokens = await tokenizer.encode(text);
  console.log("Generated tokens:", tokens);

  const validTokens = tokens.filter(token => token !== undefined && token !== null);
  if (validTokens.length === 0) {
    throw new Error("No valid tokens generated. Check tokenizer configuration or input text.");
  }

  const chunks: string[] = [];
  for (let i = 0; i < validTokens.length; i += maxTokens - overlap) {
    const chunkTokens = validTokens.slice(i, i + maxTokens);
    try {
      const chunkText = await tokenizer.decode(chunkTokens, { skip_special_tokens: true }) || "";
      if (chunkText.trim()) {
        chunks.push(chunkText);
      }
    } catch (error) {
      console.error(`Error decoding tokens for chunk at index ${i}:`, error);
    }
  }

  return chunks;
}

/**
 * Sends a chunk of text to the LM Studio API or OpenAI API based on configuration.
 * @param chunk - The text chunk to process.
 * @param prompt - The prompt to use for processing.
 * @returns The processed output as a string.
 */
async function processChunkWithPrompt(chunk: string, prompt: string): Promise<string> {

  if (CONFIG.API_PROVIDER === "lm-studio") {
    const payload = {
      model: CONFIG.MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `${prompt}${chunk}` },
      ],
      max_tokens: CONFIG.MAX_RESPONSE_TOKEN,
      temperature: 0.5,
      stream: false,
    };

    try {
      const response = await fetch(CONFIG.LM_STUDIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LMStudio Error: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.error("LMStudio API error:", error);
      return "";
    }
  } else if (CONFIG.API_PROVIDER === "openai") {
    const openAiPayload = {
      model: CONFIG.MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `${prompt}${chunk}` },
      ],
      max_tokens: CONFIG.MAX_RESPONSE_TOKEN,
    };

    try {
      const response = await fetch(CONFIG.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(openAiPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Error: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "";
    }
  }

  throw new Error("Invalid API provider specified in CONFIG.API_PROVIDER");
}

/**
 * Processes chunks hierarchically or in a single pass.
 * @param chunks - Array of text chunks.
 * @returns The final processed output string.
 */
async function processChunks(chunks: string[]): Promise<string> {
  if (CONFIG.PROCESS_MODE === "single-pass") {
    const results = await Promise.all(chunks.map(chunk => processChunkWithPrompt(chunk, CONFIG.CHUNK_PROMPT)));
    return results.join("\n");
  }

  console.log("Processing chunks hierarchically...");

  const chunkSummaries = await Promise.all(chunks.map(chunk => processChunkWithPrompt(chunk, CONFIG.CHUNK_PROMPT)));
  const combinedText = chunkSummaries.join("\n");
  const combinedSummary = await processChunkWithPrompt(combinedText, CONFIG.FINAL_PROMPT);
  console.log("combinedSummary:", combinedSummary);
  return combinedSummary
}

/**
 * Main function to orchestrate the workflow.
 */
(async () => {
  try {
    const rawText = await fs.readFile(`${CONFIG.INPUT_DIR}/bulkie.txt`, "utf-8");
    const chunks = await chunkTextWithOverlap(rawText, CONFIG.MAX_TOKENS, CONFIG.CHUNK_OVERLAP);
    const finalOutput = await processChunks(chunks);
    await fs.writeFile(CONFIG.OUTPUT_FILE, finalOutput, "utf-8");
    console.log(`\nFinal output saved to ${CONFIG.OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error in processing pipeline:", error);
  }
})();