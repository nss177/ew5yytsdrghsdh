# NeuroFlow Studio

Красивый веб-интерфейс + консольный AI-ассистент с логикой размышления, контекстной памятью и генерацией небольших кодовых примеров.

## Что умеет

- Современный chat UI (glassmorphism + градиенты + quick actions).
- Контекст диалога в рамках сессии (web/API + console).
- Режимы общения: идеи, код, план, объяснение.
- Генерация небольших кодов (JS / Python / HTML и базовый fallback).
- Вывод reasoning: интент, сигналы, план размышления.

## Запуск

```bash
npm start
```

Открой: `http://localhost:3000`

## Консольный режим

```bash
npm run cli
```

Команды в консоли:

- `/help` — помощь
- `/reset` — очистить контекст
- `/exit` — выход

## API

### `POST /api/chat`

```json
{
  "sessionId": "optional-uuid",
  "message": "Напиши небольшой код на python"
}
```

### `POST /api/reset`

```json
{
  "sessionId": "uuid-from-chat"
}
```
