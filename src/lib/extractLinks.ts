import { load } from "cheerio";

export function extractLinks(html: string): string[] {
  const $ = load(html);
  const links = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      links.add(href);
    }
  });

  return [...links];
}
