import { load } from "cheerio";
import { isMirrorablePagePath, pathnameToMirrorRoute } from "./pathMap";
import { isSameHost } from "./url";

const DISALLOWED_SCHEMES = ["mailto:", "tel:", "javascript:"];

export function rewriteInternalPageLinks(
  html: string,
  currentUrl: URL,
  baseHost: string,
  outputFolder: string
): string {
  const $ = load(html);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    const rewritten = rewriteHref(href, currentUrl, baseHost, outputFolder);
    if (rewritten) {
      $(element).attr("href", rewritten);
    }
  });

  return $.html();
}

function rewriteHref(
  href: string,
  currentUrl: URL,
  baseHost: string,
  outputFolder: string
): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (DISALLOWED_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return null;
  }

  let resolved: URL;
  try {
    resolved = new URL(trimmed, currentUrl);
  } catch {
    return null;
  }

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    return null;
  }

  if (!isSameHost(resolved, baseHost)) {
    return null;
  }

  if (!isMirrorablePagePath(resolved.pathname)) {
    return resolved.toString();
  }

  return `${pathnameToMirrorRoute(resolved.pathname, outputFolder)}${resolved.search}${resolved.hash}`;
}
