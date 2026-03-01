const KEYWORD_GROUPS = {
  greeting: ["привет", "здравствуйте", "hello", "hi", "добрый"],
  planning: ["план", "шаг", "организ", "структур", "roadmap", "запуск"],
  coding: ["код", "програм", "скрипт", "api", "функц", "алгоритм", "напиши"],
  idea: ["идея", "стартап", "продукт", "бизнес", "ниш", "концепт"],
  design: ["дизайн", "интерфейс", "ui", "ux", "красив", "стиль"],
  learning: ["объяс", "научи", "как", "почему", "пример"],
  productivity: ["быстр", "эффектив", "оптим", "автомат"],
};

const SNIPPETS = {
  javascript: {
    trigger: ["js", "javascript", "node", "express"],
    title: "JavaScript: минимальный HTTP API",
    code: `import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => console.log("http://localhost:3000"));`,
  },
  python: {
    trigger: ["python", "py", "fastapi", "flask"],
    title: "Python: функция с CLI запуском",
    code: `def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

if __name__ == "__main__":
    print(fibonacci(10))  # 55`,
  },
  html: {
    trigger: ["html", "css", "вёрст", "верст"],
    title: "HTML/CSS: карточка интерфейса",
    code: `<section class="card">
  <h2>AI Widget</h2>
  <p>Умный помощник для идей и кода.</p>
  <button>Запустить</button>
</section>`
  },
};

function normalize(text) {
  return text.toLowerCase().trim();
}

function detectIntent(text) {
  const message = normalize(text);
  let topIntent = "general";
  let topScore = 0;
  const scoreMap = {};

  for (const [intent, keywords] of Object.entries(KEYWORD_GROUPS)) {
    const score = keywords.reduce((acc, keyword) => acc + (message.includes(keyword) ? 1 : 0), 0);
    scoreMap[intent] = score;
    if (score > topScore) {
      topScore = score;
      topIntent = intent;
    }
  }

  return {
    topIntent,
    confidence: topScore === 0 ? 0.28 : Math.min(0.98, 0.48 + topScore * 0.16),
    scoreMap,
  };
}

function summarizeContext(history) {
  if (!history.length) return "нет предыдущего контекста";

  const lastMessages = history.slice(-4).map((item) => `${item.role}: ${item.message}`).join(" | ");
  return `последние реплики: ${lastMessages}`;
}

function buildPlan(intent) {
  const corePlans = {
    greeting: [
      "Поддержать дружелюбный старт беседы.",
      "Предложить доступные режимы: идеи, код, план.",
      "Попросить конкретизировать результат.",
    ],
    planning: [
      "Собрать цель, сроки и ограничения.",
      "Разбить задачу на 3–7 этапов.",
      "Дать следующий конкретный шаг на сегодня.",
    ],
    coding: [
      "Уточнить язык/стек и формат запуска.",
      "Сгенерировать короткий рабочий код.",
      "Добавить инструкции запуска и расширения.",
    ],
    idea: [
      "Сформулировать 3 жизнеспособные идеи.",
      "Дать ценность, аудиторию и монетизацию.",
      "Предложить MVP на 1 неделю.",
    ],
    design: [
      "Определить визуальный стиль и структуру экрана.",
      "Сфокусироваться на читаемости и CTA.",
      "Проверить мобильную адаптацию.",
    ],
    learning: [
      "Объяснить через простую ментальную модель.",
      "Показать короткий пример.",
      "Закрепить мини-заданием.",
    ],
    productivity: [
      "Найти повторяемые действия.",
      "Предложить автоматизацию шаблонами.",
      "Оценить экономию времени.",
    ],
    general: [
      "Выделить основную цель пользователя.",
      "Предложить практичный формат ответа.",
      "Дать шаг, который можно сделать сразу.",
    ],
  };

  return corePlans[intent] || corePlans.general;
}

function detectSnippetRequest(message) {
  if (!["код", "напиши", "пример", "snippet", "скрипт"].some((token) => message.includes(token))) {
    return null;
  }

  for (const snippet of Object.values(SNIPPETS)) {
    if (snippet.trigger.some((token) => message.includes(token))) {
      return snippet;
    }
  }

  return {
    title: "JavaScript: универсальный пример функции",
    code: `function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

console.log(chunk([1,2,3,4,5], 2)); // [[1,2],[3,4],[5]]`,
  };
}

function buildIdeaPack() {
  return [
    "1) AI-копилот для фрилансеров: бриф -> КП -> чеклист сдачи.",
    "2) Микро-SaaS для Telegram-каналов: идеи контента + план постинга.",
    "3) Локальный Dev Assistant: генерация шаблонного кода и задач по roadmap.",
  ].join("\n");
}

function craftReply({ intent, confidence, message, contextSummary, snippet }) {
  const confidencePercent = Math.round(confidence * 100);

  const openers = {
    greeting: "Привет! Готов включиться в работу 🚀",
    planning: "Отлично, соберём понятный и реализуемый план.",
    coding: "Перехожу в режим генерации кода 👨‍💻",
    idea: "Супер, вот идеи с фокусом на реализацию.",
    design: "Сделаем красиво и удобно для пользователя ✨",
    learning: "Объясняю по шагам, максимально практично.",
    productivity: "Сфокусируемся на ускорении результата ⚡",
    general: "Принято. Дам структурированный и полезный ответ.",
  };

  const base = [
    openers[intent] || openers.general,
    `Контекст: ${contextSummary}.`,
  ];

  if (intent === "idea") {
    base.push("\nИдеи для старта:\n" + buildIdeaPack());
    base.push("\nЕсли хочешь, выберу одну идею и распишу MVP, стек и первые 10 задач.");
  }

  if (intent === "planning") {
    base.push("\nШаблон плана: цель → MVP → разработка → тесты → релиз → итерация.");
  }

  if (snippet) {
    base.push(`\n${snippet.title}:\n\n\`\`\`\n${snippet.code}\n\`\`\``);
    base.push("\nМогу сразу сгенерировать следующий файл/модуль под твой кейс.");
  }

  if (intent === "general" && !snippet && message.length < 18) {
    base.push("Уточни задачу одним предложением: что создать и в каком формате нужен результат.");
  }

  base.push(`\nУверенность интерпретации: ${confidencePercent}%.`);
  return base.join("\n");
}

export function runAssistant({ message, history = [] }) {
  const safeMessage = (message ?? "").trim();

  if (!safeMessage) {
    return {
      intent: "general",
      confidence: 0.28,
      reasoning: ["Пустой ввод: попросить пользователя сформулировать цель."],
      reply: "Пока сообщение пустое. Напиши, что нужно: идея, план или код.",
    };
  }

  const normalized = normalize(safeMessage);
  const { topIntent, confidence, scoreMap } = detectIntent(normalized);
  const plan = buildPlan(topIntent);
  const contextSummary = summarizeContext(history);
  const snippet = detectSnippetRequest(normalized);

  const rankedSignals = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([intent, score]) => `${intent}:${score}`);

  const reasoning = [
    `Определён интент: ${topIntent}.`,
    `Ключевые сигналы: ${rankedSignals.join(", ")}.`,
    `Контекст диалога: ${contextSummary}.`,
    ...plan,
    snippet ? "Запрошен кодовый пример: добавляю рабочий сниппет." : "Кодовый сниппет не запрошен явно.",
  ];

  return {
    intent: topIntent,
    confidence,
    reasoning,
    reply: craftReply({
      intent: topIntent,
      confidence,
      message: normalized,
      contextSummary,
      snippet,
    }),
  };
}
