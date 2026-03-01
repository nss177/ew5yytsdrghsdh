import readline from "node:readline";
import { runAssistant } from "./ai/engine.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "you> ",
});

console.log("🤖 AI Console Assistant");
console.log("Напиши сообщение. Команды: /exit, /help\n");
rl.prompt();

rl.on("line", (line) => {
  const text = line.trim();

  if (text === "/exit") {
    rl.close();
    return;
  }

  if (text === "/help") {
    console.log("Команды:\n  /help - показать помощь\n  /exit - завершить работу\n");
    rl.prompt();
    return;
  }

  const result = runAssistant(text);

  console.log(`\nai> ${result.reply}`);
  console.log("\n--- Логика размышления ---");
  result.reasoning.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  console.log("--------------------------\n");

  rl.prompt();
});

rl.on("close", () => {
  console.log("\nПока! Возвращайся с новыми задачами 👋");
  process.exit(0);
});
