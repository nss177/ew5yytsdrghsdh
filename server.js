import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { runAssistant } from "./ai/engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": mimeTypes[".json"] });
  res.end(JSON.stringify(payload));
}

function getSession(sessionId) {
  const id = sessionId || randomUUID();

  if (!sessions.has(id)) {
    sessions.set(id, []);
  }

  return { id, history: sessions.get(id) };
}

function appendToHistory(sessionId, role, message) {
  const history = sessions.get(sessionId) || [];
  history.push({ role, message });
  sessions.set(sessionId, history.slice(-10));
}

async function serveStatic(req, res) {
  const safePath = req.url === "/" ? "/index.html" : req.url;
  const resolvedPath = path.join(publicDir, path.normalize(safePath));

  if (!resolvedPath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeType = mimeTypes[ext] || "application/octet-stream";

  try {
    const data = await fs.readFile(resolvedPath);
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const { message, sessionId } = JSON.parse(body || "{}");
        const text = String(message || "").trim();
        const session = getSession(sessionId);

        if (!text) {
          sendJson(res, 400, { error: "Message is required", sessionId: session.id });
          return;
        }

        appendToHistory(session.id, "user", text);
        const result = runAssistant({ message: text, history: session.history });
        appendToHistory(session.id, "assistant", result.reply);

        sendJson(res, 200, {
          ...result,
          sessionId: session.id,
        });
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
      }
    });

    return;
  }

  if (req.method === "POST" && req.url === "/api/reset") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const sessionId = parsed.sessionId;

        if (sessionId && sessions.has(sessionId)) {
          sessions.delete(sessionId);
        }

        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
      }
    });

    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`AI web app started on http://localhost:${PORT}`);
  console.log("Console AI mode: npm run cli");
});
