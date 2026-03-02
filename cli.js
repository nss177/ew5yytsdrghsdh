import readline from "node:readline";
import { randomUUID } from "node:crypto";
import { runAssistant } from "./ai/engine.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "you> ",
});

let history = [];
let sessionId = randomUUID();

function printHelp() {
  console.log("Команды:");
  console.log("  /help  - показать помощь");
  console.log("  /reset - очистить контекст и начать новый диалог");
  console.log("  /exit  - завершить работу\n");
}

console.log("🤖 AI Console Assistant v2");
console.log(`Session: ${sessionId}`);
console.log("Режимы: идеи, план, код, объяснения. Команды: /help, /reset, /exit\n");
rl.prompt();

rl.on("line", (line) => {
  const text = line.trim();

  if (text === "/exit") {
    rl.close();
    return;
  }

  if (text === "/help") {
    printHelp();
    rl.prompt();
    return;
  }

  if (text === "/reset") {
    history = [];
    sessionId = randomUUID();
    console.log(`Новая сессия: ${sessionId}\n`);
    rl.prompt();
    return;
  }

  const result = runAssistant({ message: text, history });
  history.push({ role: "user", message: text });
  history.push({ role: "assistant", message: result.reply });
  history = history.slice(-10);

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
