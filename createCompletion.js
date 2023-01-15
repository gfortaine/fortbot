import { streamCompletion } from "@fortaine/openai/stream";
import { Configuration, OpenAIApi } from "@fortaine/openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function createCompletion({ model, prompt }) {
  // console.log("createCompletion prompt:", prompt)
  try {
    // https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
    const max_tokens = 4097 - prompt.length;

    const completion = await openai.createCompletion(
      {
        model,
        max_tokens,
        prompt,
        stream: true,
      },
      { responseType: "stream" }
    );

    for await (const message of streamCompletion(completion.data)) {
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
    if (error.response?.status) {
      console.error(error.response.status, error.message);

      for await (const data of error.response.data) {
        const message = data.toString();

        try {
          const parsed = JSON.parse(message);

          console.error("An error occurred during OpenAI request: ", parsed);
        } catch (error) {
          console.error("An error occurred during OpenAI request: ", message);
        }
      }
    } else {
      console.error("An error occurred during OpenAI request", error);
    }
  }
}
