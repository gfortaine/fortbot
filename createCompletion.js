import { createConfiguration, OpenAIApi } from "@fortaine/openai";
import { streamCompletion } from "@fortaine/openai/stream";

const configurationOpts = {
  authMethods: {
    apiKeyAuth: {
      accessToken: process.env.OPENAI_API_KEY,
    },
  },
};
const configuration = createConfiguration(configurationOpts);

const openai = new OpenAIApi(configuration);

export async function createCompletion({ model, prompt }) {
  try {
    // https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
    const max_tokens = 4097 - prompt.length;

    const completion = await openai.createCompletion({
      model,
      prompt,
      max_tokens,
      stream: true,
    });

    for await (const message of streamCompletion(completion)) {
      try {
        const parsed = JSON.parse(message);
        const { text } = parsed.choices[0];

        process.stdout.write(text);
      } catch (error) {
        console.error("Could not JSON parse stream message", message, error);
      }
    }
    process.stdout.write("\n");
  } catch (error) {
    if (error.code) {
      try {
        const parsed = JSON.parse(error.body);
        console.error("An error occurred during OpenAI request: ", parsed);
      } catch (error) {
        console.error("An error occurred during OpenAI request: ", error);
      }
    } else {
      console.error("An error occurred during OpenAI request", error);
    }
  }
}
