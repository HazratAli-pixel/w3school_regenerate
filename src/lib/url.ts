const DISALLOWED_SCHEMES = ["mailto:", "tel:", "javascript:"];

export function normalizeForCrawl(rawUrl: string, baseUrl: URL): URL | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (DISALLOWED_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }

  url.hash = "";

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  return url;
}

export function toCanonicalKey(url: URL): string {
  const normalized = new URL(url.toString());
  normalized.hash = "";
  normalized.search = "";

  if (normalized.pathname.length > 1 && normalized.pathname.endsWith("/")) {
    normalized.pathname = normalized.pathname.replace(/\/+$/, "");
  }

  return normalized.toString();
}

export function isSameHost(url: URL, host: string): boolean {
  return url.host === host;
}
