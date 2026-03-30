import path from "node:path";

export function routeToLocalPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "");

  if (clean === "" || clean === "/") {
    return path.join("public", "index.html");
  }

  const trimmed = clean.startsWith("/") ? clean.slice(1) : clean;
  const safeSegments = trimmed
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponentSafe(segment)));

  return path.join("public", ...safeSegments, "index.html");
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
