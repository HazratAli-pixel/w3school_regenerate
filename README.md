# Static Mirror Crawler

This project is a **Node.js + TypeScript static website mirror** for any site you set in `BASE_URL`.

It crawls internal pages (same host only), saves HTML snapshots under a route-mirrored structure in `public/`, and serves them locally as static files.

## What it does

- Starts from the URL defined in `BASE_URL`
- Crawls only internal pages on the same host
- Respects `robots.txt` (`User-agent: *` allow/disallow rules)
- Skips disallowed paths and non-HTML responses
- Removes URL fragments and deduplicates by canonical URL
- Uses breadth-first crawling with configurable concurrency
- Saves up to 100 HTML pages by default
- Converts source page URLs like `.asp` or `.php` into extensionless local mirror routes
- Writes:
  - route snapshots as `public/<route>/index.html`
  - `public/__mirror_manifest.json`
  - `crawl-report.json`

Each saved HTML file includes a top comment containing source URL and timestamp.
Internal page links are rewritten as relative `index.html` paths, so pages can be opened directly from the `public/` folder and still navigate locally.
Internal page links are rewritten to the local extensionless route, so browsing the mirror shows the URL path without source page types like `.asp`.

## Important limitations

- This is a **static mirror**, not a functional clone.
- Dynamic behavior (client-side APIs, auth/session features) may not work.
- Login, forms, search, or interactive tools may fail.
- Asset URLs are currently kept as original absolute URLs (external CSS/JS/images are not downloaded in this first version).

## Legal & ethical caution

Before crawling/mirroring public websites, review site terms and policies. Use responsibly, keep limits conservative, and respect `robots.txt`.

## Requirements

- Node.js 20+

## Install

```bash
npm install
```

## Usage

### Change `BASE_URL`

Recommended: pass `BASE_URL` when running the crawl command.

Example:

```bash
BASE_URL=https://example.com npm run crawl root
```

If you want to change the default permanently, edit [src/crawl.ts](/Users/hazratali/Downloads/Developer/NDI/w3school_regenerate/src/crawl.ts#L33) and replace the `BASE_URL` fallback value.

### Crawl pages step by step

1. Install dependencies:

```bash
npm install
```

2. Choose the site URL with `BASE_URL`.

3. Choose where files should be written under `public/`.

4. Run the crawl.

### Output folder rules

- `root` writes directly under `public/`
- any other name writes under `public/<name>/`
- nested names like `japan/news` write under `public/japan/news/`

Examples:

```bash
BASE_URL=https://example.com npm run crawl root
```

This writes files like:

```bash
public/about/index.html
```

```bash
BASE_URL=https://example.com npm run crawl japan
```

This writes files like:

```bash
public/japan/about/index.html
```

```bash
BASE_URL=https://example.com npm run crawl japan/news
```

This writes files like:

```bash
public/japan/news/about/index.html
```

Optional env vars:

- `MAX_PAGES` default: `100`
- `CONCURRENCY` default: `3`

Example with all options:

```bash
BASE_URL=https://example.com MAX_PAGES=50 CONCURRENCY=5 npm run crawl japan/news
```

### Serve static snapshot

```bash
npm run serve
```

Default server URL:

- `http://localhost:4173`

If you crawled with `root`, open:

- `http://localhost:4173/`

If you crawled with a folder like `japan/news`, open:

- `http://localhost:4173/japan/news/`

### Dev alias

```bash
npm run dev
```

### Type check

```bash
npm run typecheck
```

### Deploy to Vercel

```bash
npm run deploy:vercel
```

This command:

- reads `crawl-report.json`
- creates `public/index.html` if needed
- redirects the Vercel root `/` to the crawled base route automatically
- deploys to your configured Vercel project

Example:

```bash
BASE_URL=https://example.com/en npm run crawl root
npm run deploy:vercel
```

In that case, opening the Vercel root will automatically go to `/en/`.

## Project structure

- `src/crawl.ts`
- `src/server.ts`
- `src/lib/url.ts`
- `src/lib/fs.ts`
- `src/lib/robots.ts`
- `src/lib/fetchPage.ts`
- `src/lib/extractLinks.ts`
- `src/lib/pathMap.ts`
