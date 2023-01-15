import dotenv from "dotenv-flow";
import inquirer from "inquirer";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

process.chdir(__dirname);

dotenv.config({
  node_env: process.env.APP_ENV || process.env.NODE_ENV || "development",
  silent: true,
});

// https://2ality.com/2022/08/node-util-parseargs.html
const {
  values: { model },
} = parseArgs({
  options: {
    model: {
      type: "string",
    },
  },
});

if (typeof model === "undefined") {
  throw new TypeError(
    "[ERR_PARSE_ARGS_INVALID_OPTION_VALUE]: Option '--model <value>' argument missing"
  );
}

const questions = [
  {
    type: "input",
    name: "prompt",
    message: "prompt",
    validate(text) {
      if (text.length === 0) {
        return "[ERR_PARSE_ARGS_INVALID_OPTION_VALUE]: Option '--prompt <value>' argument missing";
      }

      return true;
    },
  },
];

const { prompt } = await inquirer.prompt(questions);

const { createCompletion } = await import("./createCompletion.js");

createCompletion({ model, prompt });
