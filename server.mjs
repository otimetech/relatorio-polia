import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const DEFAULT_API_TARGET_URL = "https://ayfkjjdgrbymmlkuzbig.supabase.co/functions/v1";
const STATIC_FILE_EXTENSIONS = new Set([
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpg",
  ".jpeg",
  ".js",
  ".json",
  ".map",
  ".png",
  ".svg",
  ".txt",
  ".webp",
  ".woff",
  ".woff2",
]);
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDirectory = join(__dirname, "dist");
const port = Number.parseInt(process.env.PORT || "4173", 10);
const apiTargetUrl = normalizeApiTargetUrl(
  process.env.API_TARGET_URL || process.env.SUPABASE_FUNCTIONS_BASE_URL || readAbsoluteUrl(process.env.VITE_API_URL) || DEFAULT_API_TARGET_URL,
);

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await proxyRequest(request, response, requestUrl);
      return;
    }

    await serveStaticAsset(request, response, requestUrl);
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno do servidor" }));
  }
});

server.listen(port, () => {
  console.log(`Servidor iniciado em http://0.0.0.0:${port}`);
  console.log(`Proxy /api apontando para ${apiTargetUrl}`);
});

function normalizeApiTargetUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function readAbsoluteUrl(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}

function sanitizeRelativePath(pathname) {
  const normalizedPath = normalize(pathname).replace(/^([.][.][/\\])+/, "");
  return normalizedPath.replace(/^[/\\]+/, "");
}

async function proxyRequest(request, response, requestUrl) {
  const upstreamUrl = `${apiTargetUrl}${requestUrl.pathname.replace(/^\/api/, "")}${requestUrl.search}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (!value) {
      continue;
    }

    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "accept-encoding" ||
      lowerKey === "host" ||
      lowerKey === "connection" ||
      lowerKey === "content-length"
    ) {
      continue;
    }

    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request,
    duplex: request.method === "GET" || request.method === "HEAD" ? undefined : "half",
    redirect: "manual",
  });

  const responseHeaders = {};
  upstreamResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "connection" ||
      lowerKey === "content-encoding" ||
      lowerKey === "content-length" ||
      lowerKey === "transfer-encoding"
    ) {
      return;
    }

    responseHeaders[key] = value;
  });

  response.writeHead(upstreamResponse.status, responseHeaders);

  if (!upstreamResponse.body || request.method === "HEAD") {
    response.end();
    return;
  }

  Readable.fromWeb(upstreamResponse.body).pipe(response);
}

async function serveStaticAsset(request, response, requestUrl) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Metodo nao suportado" }));
    return;
  }

  const relativePath = sanitizeRelativePath(requestUrl.pathname);
  const requestedExtension = extname(relativePath);
  const directFilePath = join(distDirectory, relativePath || "index.html");

  if (await fileExists(directFilePath)) {
    await streamFile(response, directFilePath, request.method === "HEAD");
    return;
  }

  if (requestedExtension && STATIC_FILE_EXTENSIONS.has(requestedExtension)) {
    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Arquivo nao encontrado" }));
    return;
  }

  await streamFile(response, join(distDirectory, "index.html"), request.method === "HEAD");
}

async function fileExists(filePath) {
  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

async function streamFile(response, filePath, headOnly) {
  const fileExtension = extname(filePath);
  const fileStats = await stat(filePath);

  response.writeHead(200, {
    "content-type": MIME_TYPES[fileExtension] || "application/octet-stream",
    "content-length": fileStats.size,
  });

  if (headOnly) {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}