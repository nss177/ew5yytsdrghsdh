const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

function addBubble(text, role, meta = "") {
  const bubble = document.createElement("article");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;

  if (meta) {
    const info = document.createElement("p");
    info.className = "meta";
    info.textContent = meta;
    bubble.appendChild(info);
  }

  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

addBubble(
  "Привет! Я могу вести диалог и показывать логику размышления. Напиши задачу.",
  "ai",
  "Готов к работе"
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  addBubble(message, "user");
  userInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const trace = data.reasoning
      .map((step, index) => `${index + 1}) ${step}`)
      .join(" | ");

    addBubble(data.reply, "ai", `Интент: ${data.intent}. Размышление: ${trace}`);
  } catch {
    addBubble("Не удалось получить ответ от сервера. Проверь, что приложение запущено.", "ai", "Ошибка соединения");
  }
});
