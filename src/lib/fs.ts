import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDirForFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await ensureDirForFile(filePath);
  await writeFile(filePath, contents, "utf8");
}

export function projectPath(...segments: string[]): string {
  return path.resolve(process.cwd(), ...segments);
}
