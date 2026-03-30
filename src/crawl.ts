import path from "node:path";
import pLimit from "p-limit";
import { writeTextFile, projectPath } from "./lib/fs";
import { fetchHtmlPage } from "./lib/fetchPage";
import { extractLinks } from "./lib/extractLinks";
import { routeToLocalPath } from "./lib/pathMap";
import { RobotsPolicy } from "./lib/robots";
import { isSameHost, normalizeForCrawl, toCanonicalKey } from "./lib/url";

interface ManifestItem {
  sourceUrl: string;
  canonicalUrl: string;
  localPath: string;
  fetchedAt: string;
}

interface CrawlReport {
  startedAt: string;
  finishedAt: string;
  baseUrl: string;
  maxPages: number;
  concurrency: number;
  visitedCount: number;
  savedCount: number;
  skippedByRobots: number;
  skippedExternal: number;
  skippedNonHtml: number;
  failedFetches: number;
  collisions: number;
}

const BASE_URL = "https://www.w3schools.com/";
const DEFAULT_MAX_PAGES = Number(process.env.MAX_PAGES ?? "300");
const DEFAULT_CONCURRENCY = Number(process.env.CONCURRENCY ?? "3");

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const base = new URL(BASE_URL);
  const robots = await RobotsPolicy.fromHost(base.origin);

  const queue: string[] = [base.toString()];
  const seen = new Set<string>();
  const manifest: ManifestItem[] = [];

  const localPathOwner = new Map<string, string>();

  let cursor = 0;
  let skippedByRobots = 0;
  let skippedExternal = 0;
  let skippedNonHtml = 0;
  let failedFetches = 0;
  let collisions = 0;

  const limit = pLimit(DEFAULT_CONCURRENCY);

  const processUrl = async (candidate: string): Promise<void> => {
    const normalized = normalizeForCrawl(candidate, base);
    if (!normalized) return;
    if (!isSameHost(normalized, base.host)) {
      skippedExternal += 1;
      return;
    }

    const canonicalKey = toCanonicalKey(normalized);
    if (seen.has(canonicalKey)) return;
    seen.add(canonicalKey);

    if (!robots.isAllowed(normalized.pathname)) {
      skippedByRobots += 1;
      return;
    }

    const fetched = await fetchHtmlPage(normalized.toString());
    if (!fetched) {
      failedFetches += 1;
      return;
    }

    const finalUrl = new URL(fetched.finalUrl);
    if (!isSameHost(finalUrl, base.host)) {
      skippedExternal += 1;
      return;
    }

    if (!robots.isAllowed(finalUrl.pathname)) {
      skippedByRobots += 1;
      return;
    }

    if (!fetched.contentType.toLowerCase().includes("text/html")) {
      skippedNonHtml += 1;
      return;
    }

    const localRelativePath = routeToLocalPath(finalUrl.pathname);
    const existingOwner = localPathOwner.get(localRelativePath);
    if (existingOwner && existingOwner !== canonicalKey) {
      collisions += 1;
      return;
    }
    localPathOwner.set(localRelativePath, canonicalKey);

    const snapshotComment = `<!-- mirrored static snapshot | source: ${finalUrl.toString()} | fetchedAt: ${new Date().toISOString()} -->\n`;
    const withComment = `${snapshotComment}${fetched.html}`;
    await writeTextFile(projectPath(localRelativePath), withComment);

    manifest.push({
      sourceUrl: finalUrl.toString(),
      canonicalUrl: canonicalKey,
      localPath: localRelativePath,
      fetchedAt: new Date().toISOString()
    });

    const links = extractLinks(fetched.html);
    for (const rawLink of links) {
      const asUrl = normalizeForCrawl(rawLink, finalUrl);
      if (!asUrl) continue;
      if (!isSameHost(asUrl, base.host)) continue;
      if (!robots.isAllowed(asUrl.pathname)) continue;
      const key = toCanonicalKey(asUrl);
      if (!seen.has(key)) {
        queue.push(asUrl.toString());
      }
    }
  };

  while (cursor < queue.length && manifest.length < DEFAULT_MAX_PAGES) {
    const slots = Math.min(DEFAULT_CONCURRENCY, DEFAULT_MAX_PAGES - manifest.length);
    const batch = queue.slice(cursor, cursor + slots);
    cursor += batch.length;

    await Promise.all(batch.map((url) => limit(() => processUrl(url))));
  }

  const manifestPath = projectPath("public", "__mirror_manifest.json");
  await writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));

  const report: CrawlReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: base.toString(),
    maxPages: DEFAULT_MAX_PAGES,
    concurrency: DEFAULT_CONCURRENCY,
    visitedCount: seen.size,
    savedCount: manifest.length,
    skippedByRobots,
    skippedExternal,
    skippedNonHtml,
    failedFetches,
    collisions
  };

  await writeTextFile(projectPath("crawl-report.json"), JSON.stringify(report, null, 2));

  console.log(`Crawl complete: saved ${manifest.length} pages.`);
}

void main().catch((error: unknown) => {
  console.error("Crawl failed", error);
  process.exitCode = 1;
});
