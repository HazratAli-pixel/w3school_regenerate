import path from "node:path";

const PAGE_EXTENSIONS = new Set([".asp", ".aspx", ".htm", ".html", ".jsp", ".php"]);

export function routeToLocalPath(pathname: string, outputFolder = "root"): string {
  const safeSegments = toOutputSegments(pathname, outputFolder).map((segment) =>
    encodeURIComponent(decodeURIComponentSafe(segment))
  );

  if (safeSegments.length === 0) {
    return path.join("public", "index.html");
  }

  return path.join("public", ...safeSegments, "index.html");
}

export function pathnameToMirrorRoute(pathname: string, outputFolder = "root"): string {
  const safeSegments = toOutputSegments(pathname, outputFolder).map((segment) =>
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

export function normalizeOutputFolder(rawValue?: string): string {
  const trimmed = (rawValue ?? "root").trim();
  if (trimmed === "" || trimmed.toLowerCase() === "root") {
    return "root";
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const segments = normalized
    .split("/")
    .map((segment) => decodeURIComponentSafe(segment).trim())
    .filter((segment) => segment !== "" && segment !== "." && segment !== "..");

  if (segments.length === 0) {
    return "root";
  }

  return segments.join("/");
}

function toOutputSegments(pathname: string, outputFolder: string): string[] {
  const baseSegments = toBaseSegments(outputFolder);
  const pathnameSegments = toMirrorSegments(pathname);

  if (baseSegments.length === 0) {
    return pathnameSegments;
  }

  return [...baseSegments, ...pathnameSegments];
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

function toBaseSegments(outputFolder: string): string[] {
  const normalized = normalizeOutputFolder(outputFolder);
  if (normalized === "root") {
    return [];
  }

  return normalized.split("/").filter(Boolean);
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
