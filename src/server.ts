import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { pathnameToMirrorRoute, routeToLocalPath } from "./lib/pathMap";

const app = express();
const port = Number(process.env.PORT ?? "4173");
const publicDir = path.resolve(process.cwd(), "public");

app.use((req, res, next) => {
  const normalizedRoute = pathnameToMirrorRoute(req.path);
  if (normalizedRoute !== req.path) {
    res.redirect(301, normalizedRoute);
    return;
  }

  next();
});

app.use(express.static(publicDir));

app.get("/{*path}", (req, res) => {
  const candidate = path.resolve(process.cwd(), routeToLocalPath(req.path));

  if (existsSync(candidate)) {
    res.sendFile(candidate);
    return;
  }

  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`Static mirror server running on http://localhost:${port}`);
});
