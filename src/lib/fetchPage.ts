export interface FetchPageResult {
  html: string;
  status: number;
  contentType: string;
  finalUrl: string;
}

export async function fetchHtmlPage(url: string, retries = 2): Promise<FetchPageResult | null> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "user-agent": "w3schools-static-mirror-bot/1.0"
        }
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < retries) {
          continue;
        }
        return null;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("text/html")) {
        return null;
      }

      const html = await response.text();
      return {
        html,
        status: response.status,
        contentType,
        finalUrl: response.url
      };
    } catch {
      if (attempt === retries) return null;
    }
  }

  return null;
}
