/**
 * Rewrites tests/fixtures/blogger.json from the live feed.
 *
 * The snapshot is asserted to hold the whole blog, so it has to be refreshed
 * whenever posts are added upstream. Pagination mirrors fetchBlogger: the
 * first page carries the feed envelope, later pages only contribute entries.
 */
import { writeFileSync } from 'node:fs';
import { BLOGGER_FEED, type BloggerEntry } from './lib/blogger.ts';

const OUT = new URL('../tests/fixtures/blogger.json', import.meta.url);

type Feed = {
    feed: { entry?: BloggerEntry[]; 'openSearch$totalResults'?: unknown };
};

let envelope: Feed | undefined;
const entries: BloggerEntry[] = [];
let start = 1;

for (;;) {
    const response = await fetch(
        `${BLOGGER_FEED}?alt=json&max-results=150&start-index=${start}`
    );
    if (!response.ok) {
        throw new Error(`blogger feed responded ${response.status}`);
    }
    const body = (await response.json()) as Feed;
    const page = body.feed.entry ?? [];
    if (page.length === 0) break;
    envelope ??= body;
    entries.push(...page);
    start += page.length;
}

if (envelope === undefined) throw new Error('feed returned no entries');

envelope.feed.entry = entries;
writeFileSync(OUT, `${JSON.stringify(envelope, null, 4)}\n`);
console.log(`wrote ${entries.length} entries to ${OUT.pathname}`);
