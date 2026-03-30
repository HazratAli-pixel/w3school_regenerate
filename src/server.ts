import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";

const app = express();
const port = Number(process.env.PORT ?? "4173");
const publicDir = path.resolve(process.cwd(), "public");

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  const relative = req.path.replace(/^\/+/, "");
  const candidate = relative
    ? path.join(publicDir, relative, "index.html")
    : path.join(publicDir, "index.html");

  if (existsSync(candidate)) {
    res.sendFile(candidate);
    return;
  }

  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`Static mirror server running on http://localhost:${port}`);
});
