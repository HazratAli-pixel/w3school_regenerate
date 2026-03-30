# W3Schools Static Mirror Crawler

This project is a **Node.js + TypeScript static website mirror** for `https://www.w3schools.com/`.

It crawls internal pages (same host only), saves HTML snapshots under a route-mirrored structure in `public/`, and serves them locally as static files.

## What it does

- Starts from `https://www.w3schools.com/`
- Crawls only internal pages on the same host
- Respects `robots.txt` (`User-agent: *` allow/disallow rules)
- Skips disallowed paths and non-HTML responses
- Removes URL fragments and deduplicates by canonical URL
- Uses breadth-first crawling with configurable concurrency
- Saves up to 300 HTML pages by default
- Converts source page URLs like `.asp` or `.php` into extensionless local mirror routes
- Writes:
  - `public/index.html` for homepage
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

### Crawl pages

```bash
npm run crawl
```

Optional env vars:

- `MAX_PAGES` (default `300`)
- `CONCURRENCY` (default `3`)

Example:

```bash
MAX_PAGES=100 CONCURRENCY=3 npm run crawl
```

### Serve static snapshot

```bash
npm run serve
```

Default server URL:

- `http://localhost:4173`

When served locally, `/section/index.html` requests are redirected to the cleaner `/section` route.

### Dev alias

```bash
npm run dev
```

### Type check

```bash
npm run typecheck
```

### Repair existing public links

If you already generated files before this behavior was added, run:

```bash
npm run repair-links
```

## Project structure

- `src/crawl.ts`
- `src/server.ts`
- `src/lib/url.ts`
- `src/lib/fs.ts`
- `src/lib/robots.ts`
- `src/lib/fetchPage.ts`
- `src/lib/extractLinks.ts`
- `src/lib/pathMap.ts`
