import { readFile } from "node:fs/promises";
import { normalizeOutputFolder, pathnameToMirrorRoute } from "./lib/pathMap";
import { projectPath, writeTextFile } from "./lib/fs";

interface CrawlReport {
  baseUrl: string;
  outputFolder?: string;
}

async function main(): Promise<void> {
  const report = await readCrawlReport();
  const baseUrl = new URL(report.baseUrl);
  const outputFolder = normalizeOutputFolder(report.outputFolder);
  const landingPath = pathnameToMirrorRoute(baseUrl.pathname, outputFolder);

  if (landingPath === "/") {
    console.log("Vercel landing route is root; no redirect file generated.");
    return;
  }

  const redirectHtml = createRedirectPage(landingPath);
  await writeTextFile(projectPath("public", "index.html"), redirectHtml);
  console.log(`Vercel landing route prepared at / -> ${landingPath}`);
}

async function readCrawlReport(): Promise<CrawlReport> {
  const reportPath = projectPath("crawl-report.json");
  const contents = await readFile(reportPath, "utf8");
  return JSON.parse(contents) as CrawlReport;
}

function createRedirectPage(landingPath: string): string {
  const targetPath = landingPath.endsWith("/") ? landingPath : `${landingPath}/`;
  const escapedPath = JSON.stringify(targetPath);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=${escapeHtmlAttribute(targetPath)}">
    <script>
      window.location.replace(${escapedPath});
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="${escapeHtmlAttribute(targetPath)}">${escapeHtmlText(targetPath)}</a>...</p>
  </body>
</html>
`;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

void main().catch((error: unknown) => {
  console.error("Failed to prepare Vercel deployment", error);
  process.exitCode = 1;
});
