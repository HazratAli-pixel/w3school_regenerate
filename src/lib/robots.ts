interface RobotsRuleSet {
  allow: string[];
  disallow: string[];
}

export class RobotsPolicy {
  private readonly rules: RobotsRuleSet;

  private constructor(rules: RobotsRuleSet) {
    this.rules = rules;
  }

  static async fromHost(origin: string): Promise<RobotsPolicy> {
    const robotsUrl = new URL("/robots.txt", origin).toString();

    try {
      const response = await fetch(robotsUrl);
      if (!response.ok) {
        return new RobotsPolicy({ allow: [], disallow: [] });
      }

      const content = await response.text();
      return new RobotsPolicy(parseRobots(content));
    } catch {
      return new RobotsPolicy({ allow: [], disallow: [] });
    }
  }

  isAllowed(pathname: string): boolean {
    const allowLen = longestMatch(pathname, this.rules.allow);
    const disallowLen = longestMatch(pathname, this.rules.disallow);

    if (allowLen === 0 && disallowLen === 0) return true;
    return allowLen >= disallowLen;
  }
}

function parseRobots(contents: string): RobotsRuleSet {
  const lines = contents.split(/\r?\n/);

  let currentTargets: string[] = [];
  const globalRules: RobotsRuleSet = { allow: [], disallow: [] };

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      currentTargets = [value.toLowerCase()];
      continue;
    }

    if (!currentTargets.includes("*")) {
      continue;
    }

    if (key === "allow" && value) {
      globalRules.allow.push(value);
    }

    if (key === "disallow" && value) {
      globalRules.disallow.push(value);
    }
  }

  return globalRules;
}

function longestMatch(pathname: string, patterns: string[]): number {
  let longest = 0;

  for (const pattern of patterns) {
    if (!pattern) continue;
    if (pathname.startsWith(pattern)) {
      longest = Math.max(longest, pattern.length);
    }
  }

  return longest;
}
