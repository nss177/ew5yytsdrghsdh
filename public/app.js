const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sessionInfo = document.getElementById("sessionInfo");
const resetBtn = document.getElementById("resetBtn");
const quickButtons = Array.from(document.querySelectorAll("[data-prompt]"));

let sessionId = crypto.randomUUID();
sessionInfo.textContent = `Session: ${sessionId}`;

function addBubble(text, role, meta = "") {
  const bubble = document.createElement("article");
  bubble.className = `bubble ${role}`;

  if (text.includes("```")) {
    const parts = text.split("```");
    parts.forEach((part, index) => {
      if (index % 2 === 0) {
        if (part.trim()) {
          const p = document.createElement("p");
          p.textContent = part.trim();
          bubble.appendChild(p);
        }
      } else {
        const pre = document.createElement("pre");
        pre.textContent = part.trim();
        bubble.appendChild(pre);
      }
    });
  } else {
    bubble.textContent = text;
  }

  if (meta) {
    const info = document.createElement("p");
    info.className = "meta";
    info.textContent = meta;
    bubble.appendChild(info);
  }

  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(message) {
  addBubble(message, "user");

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  sessionId = data.sessionId || sessionId;
  sessionInfo.textContent = `Session: ${sessionId}`;

  const trace = data.reasoning.map((step, index) => `${index + 1}) ${step}`).join(" | ");
  addBubble(data.reply, "ai", `Интент: ${data.intent}. Размышление: ${trace}`);
}

addBubble(
  "Привет! Я умею: 1) генерировать идеи, 2) делать небольшие кодовые примеры, 3) строить планы. Выбери быстрый сценарий выше или напиши задачу.",
  "ai",
  "AI v2 готов"
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  userInput.value = "";

  try {
    await sendMessage(message);
  } catch {
    addBubble("Не удалось получить ответ от сервера. Проверь, что приложение запущено.", "ai", "Ошибка соединения");
  }
});

quickButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const prompt = button.dataset.prompt;

    if (!prompt) return;

    try {
      await sendMessage(prompt);
    } catch {
      addBubble("Не удалось получить ответ от сервера. Попробуй ещё раз.", "ai", "Ошибка соединения");
    }
  });
});

resetBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } finally {
    sessionId = crypto.randomUUID();
    sessionInfo.textContent = `Session: ${sessionId}`;
    addBubble("Контекст очищен. Начинаем новый диалог.", "ai", "Сессия сброшена");
  }
});
