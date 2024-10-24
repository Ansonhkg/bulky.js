import { OPENAI } from "./sdk-ai";

declare const params: {
  apiKey: string;
  prompt: string;

  // TODO: set encrypted api key to orbisdb
  // operation: 'set-api-key'
}

(async () => {
  try {
    const result = await OPENAI.fetchChatCompletion(params.apiKey, params.prompt);
    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: true,
        message: result,
      }),
    });

  } catch (error) {
    console.error(error);
    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: false,

        // @ts-ignore
        message: error.message,
      }),
    });
  }
})();