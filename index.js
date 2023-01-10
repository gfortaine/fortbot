import { Configuration, OpenAIApi } from "@fortaine/openai";
import { parseArgs } from "node:util";
import { streamCompletion } from "@fortaine/openai/stream";

import dotenv from "dotenv-flow";
import process from "process";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.chdir(__dirname);

dotenv.config({
  node_env: process.env.APP_ENV || process.env.NODE_ENV || "development",
  silent: true,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// https://2ality.com/2022/08/node-util-parseargs.html
const {
  values: { prompt },
} = parseArgs({
  options: {
    prompt: {
      type: "string",
    },
  },
});

if (typeof prompt === "undefined") {
  throw new TypeError(
    "[ERR_PARSE_ARGS_INVALID_OPTION_VALUE]: Option '--prompt <value>' argument missing"
  );
}

try {
  // https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
  const max_tokens = 4097 - prompt.length;

  const completion = await openai.createCompletion(
    {
      model: "text-davinci-003",
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
