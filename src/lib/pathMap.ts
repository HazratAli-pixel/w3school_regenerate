import path from "node:path";

const PAGE_EXTENSIONS = new Set([".asp", ".aspx", ".htm", ".html", ".jsp", ".php"]);

export function routeToLocalPath(pathname: string): string {
  const safeSegments = toMirrorSegments(pathname).map((segment) =>
    encodeURIComponent(decodeURIComponentSafe(segment))
  );

  if (safeSegments.length === 0) {
    return path.join("public", "index.html");
  }

  return path.join("public", ...safeSegments, "index.html");
}

export function pathnameToMirrorRoute(pathname: string): string {
  const safeSegments = toMirrorSegments(pathname).map((segment) =>
    encodeURIComponent(decodeURIComponentSafe(segment))
  );

  if (safeSegments.length === 0) {
    return "/";
  }

  return `/${safeSegments.join("/")}`;
}

export function isMirrorablePagePath(pathname: string): boolean {
  const segments = splitPathSegments(pathname);
  if (segments.length === 0) {
    return true;
  }

  const extension = path.extname(segments[segments.length - 1]).toLowerCase();
  return extension === "" || PAGE_EXTENSIONS.has(extension);
}

function toMirrorSegments(pathname: string): string[] {
  const segments = splitPathSegments(pathname);
  if (segments.length === 0) {
    return [];
  }

  const lastIndex = segments.length - 1;
  segments[lastIndex] = stripPageExtension(segments[lastIndex]);

  return segments.filter(Boolean);
}

function splitPathSegments(pathname: string): string[] {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "" || clean === "/") {
    return [];
  }

  const trimmed = clean.startsWith("/") ? clean.slice(1) : clean;
  return trimmed.split("/").filter(Boolean).map(decodeURIComponentSafe);
}

function stripPageExtension(segment: string): string {
  const extension = path.extname(segment).toLowerCase();
  if (!PAGE_EXTENSIONS.has(extension)) {
    return segment;
  }

  return segment.slice(0, -extension.length);
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
