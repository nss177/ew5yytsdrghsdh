const KEYWORD_GROUPS = {
  greeting: ["привет", "здравствуйте", "hello", "hi", "добрый"],
  planning: ["план", "шаг", "организ", "структур", "roadmap"],
  coding: ["код", "програм", "скрипт", "api", "функц", "алгоритм"],
  design: ["дизайн", "интерфейс", "ui", "ux", "красив", "стиль"],
  learning: ["объяс", "научи", "как", "почему", "пример"],
  productivity: ["быстр", "эффектив", "оптим", "автомат"],
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
    confidence: topScore === 0 ? 0.25 : Math.min(0.98, 0.45 + topScore * 0.17),
    scoreMap,
  };
}

function buildPlan(intent, message) {
  const hasQuestion = message.includes("?");

  const corePlans = {
    greeting: [
      "Определить тон беседы и ответить дружелюбно.",
      "Уточнить задачу пользователя, если она не сформулирована.",
      "Предложить короткий следующий шаг.",
    ],
    planning: [
      "Собрать цель, ограничения и желаемый результат.",
      "Разбить задачу на этапы и зависимости.",
      "Предложить приоритетный порядок выполнения.",
    ],
    coding: [
      "Определить стек и формат результата (CLI, web, API).",
      "Спроектировать модули и поток данных.",
      "Сгенерировать рабочий пример + проверку запуска.",
    ],
    design: [
      "Определить визуальный стиль и цветовую палитру.",
      "Сделать интерфейс выразительным и читаемым.",
      "Проверить адаптивность и удобство действий.",
    ],
    learning: [
      "Выявить текущий уровень пользователя.",
      "Дать объяснение через простую модель.",
      "Закрепить мини-практикой.",
    ],
    productivity: [
      "Найти повторяемые действия.",
      "Предложить автоматизацию или шаблон.",
      "Оценить эффект и риски внедрения.",
    ],
    general: [
      "Понять контекст и ключевую цель.",
      "Выделить 2-3 возможных подхода.",
      "Сформировать конкретный следующий шаг.",
    ],
  };

  const plan = [...corePlans[intent]];
  if (hasQuestion) {
    plan.unshift("Определить прямой вопрос и ответить без воды.");
  }

  return plan;
}

function craftReply(intent, message, confidence) {
  const openings = {
    greeting: "Привет! Рад помочь 🚀",
    planning: "Отлично, давай превратим идею в чёткий план.",
    coding: "Супер, запускаем режим разработки 👨‍💻",
    design: "Классная цель — сделаем интерфейс визуально сильным ✨",
    learning: "Хороший вопрос, объясню по шагам.",
    productivity: "Сфокусируемся на скорости и результате ⚡",
    general: "Принято. Я разберу задачу и предложу рабочий вариант.",
  };

  const actionable = {
    greeting: "Напиши, что именно хочешь создать: сайт, бота, API или всё сразу.",
    planning: "Сейчас могу выдать roadmap на 7 дней и разбить на ежедневные шаги.",
    coding: "Могу сразу дать структуру проекта, команды запуска и минимальный рабочий код.",
    design: "Предложу 2 визуальные концепции: premium glassmorphism и dark-tech neon.",
    learning: "Если хочешь, после объяснения дам тестовый мини-челлендж.",
    productivity: "Могу дать тебе ready-to-use шаблоны для автоматизации повторяемых задач.",
    general: "Уточни формат результата (текст, код, архитектура), и я соберу всё в одном ответе.",
  };

  const confidencePercent = Math.round(confidence * 100);
  return `${openings[intent]}\n\n${actionable[intent]}\n\nУверенность в интерпретации запроса: ${confidencePercent}%.`;
}

export function runAssistant(message) {
  const safeMessage = (message ?? "").trim();

  if (!safeMessage) {
    return {
      intent: "general",
      confidence: 0.25,
      reasoning: ["Ввод пустой: попросить пользователя сформулировать задачу."],
      reply: "Пока сообщение пустое. Напиши цель, и я соберу план действий.",
    };
  }

  const { topIntent, confidence, scoreMap } = detectIntent(safeMessage);
  const plan = buildPlan(topIntent, normalize(safeMessage));

  const rankedSignals = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([intent, score]) => `${intent}:${score}`);

  const reasoning = [
    `Классификация интента: ${topIntent}.`,
    `Сигналы по ключевым словам: ${rankedSignals.join(", ")}.`,
    ...plan,
  ];

  return {
    intent: topIntent,
    confidence,
    reasoning,
    reply: craftReply(topIntent, normalize(safeMessage), confidence),
  };
}
