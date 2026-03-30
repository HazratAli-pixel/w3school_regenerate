import express from "express";
import path from "node:path";
import { existsSync, statSync } from "node:fs";

const app = express();
const port = Number(process.env.PORT ?? "4173");
const publicDir = path.resolve(process.cwd(), "public");

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    next();
    return;
  }

  const filePath = resolveRequestFile(req.originalUrl);
  if (!filePath) {
    res.status(404).send("Not found");
    return;
  }

  res.sendFile(filePath);
});

function getRequestPath(requestUrl: string): string {
  return requestUrl.split("?", 1)[0] || "/";
}

function resolveRequestFile(requestUrl: string): string | null {
  const requestPath = getRequestPath(requestUrl);
  const trimmedPath = requestPath.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidates =
    trimmedPath === ""
      ? [path.resolve(publicDir, "index.html")]
      : [
          path.resolve(publicDir, trimmedPath),
          path.resolve(publicDir, trimmedPath, "index.html")
        ];

  for (const candidate of candidates) {
    if (!isInsidePublicDir(candidate) || !existsSync(candidate)) {
      continue;
    }

    const stats = statSync(candidate);
    if (stats.isFile()) {
      return candidate;
    }

    if (stats.isDirectory()) {
      const indexFile = path.join(candidate, "index.html");
      if (existsSync(indexFile) && statSync(indexFile).isFile()) {
        return indexFile;
      }
    }
  }

  return null;
}

function isInsidePublicDir(candidate: string): boolean {
  return candidate === publicDir || candidate.startsWith(`${publicDir}${path.sep}`);
}

app.listen(port, () => {
  console.log(`Static mirror server running on http://localhost:${port}`);
});
