/**
 * One-off history backfill. NOT part of the daily `yarn sync` pipeline — it is
 * kept only as a record of how `data/seed.medium.json` was produced.
 *
 * Medium's RSS feed serves the 10 most recent posts and nothing older, so the
 * 71 earlier articles were recovered once and frozen into the seed file, which
 * `scripts/sync.ts` then merges as prior state on every run.
 *
 * It reads two intermediate files, deleted once the seed exists:
 *
 * - `data/medium-ids.json` — `{ id, title }[]`, one entry per unique `/p/<id>`
 *   link found in the hand-maintained link lists that used to live in
 *   `src/config/`. Those titles were shortened by hand for the index and are
 *   kept verbatim; Medium's canonical titles are longer and less useful here.
 *
 * - `data/medium-raw.json` — `RawEntry[]` in the same order, holding the fields
 *   of `https://medium.com/p/<id>?format=json`. Medium answers 403 to curl and
 *   to plain fetchers, and headless Chrome gets a Cloudflare interstitial, so
 *   the payloads were collected by running `fetch` from a page already on the
 *   `medium.com` origin in a headful browser. The response body is prefixed
 *   with the anti-hijacking guard `])}while(1);</x>`, which must be stripped
 *   before parsing. `firstPublishedAt` (epoch ms) sits directly on
 *   `payload.value`; `tags[].slug`, `subtitle` and `previewImage.imageId` all
 *   sit under `payload.value.virtuals`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Post } from '../src/types/post.ts';
import { deriveTopic } from '../src/lib/classify.ts';

const IDS_PATH = 'data/medium-ids.json';
const RAW_PATH = 'data/medium-raw.json';
const SEED_PATH = 'data/seed.medium.json';

interface IdEntry {
    id: string;
    title: string;
}

interface RawEntry {
    id: string;
    firstPublishedAt?: number;
    tags?: string[];
    subtitle?: string | null;
    imageId?: string | null;
}

const titles: Record<string, string | undefined> = {};
for (const entry of JSON.parse(readFileSync(IDS_PATH, 'utf8')) as IdEntry[]) {
    titles[entry.id] = entry.title;
}
const raw = JSON.parse(readFileSync(RAW_PATH, 'utf8')) as RawEntry[];

const seed: Post[] = raw.map((entry) => {
    const title = titles[entry.id];
    if (title === undefined) {
        throw new Error(`${RAW_PATH} has ${entry.id}, ${IDS_PATH} does not`);
    }
    const tags = entry.tags ?? [];
    return {
        id: entry.id,
        source: 'medium',
        title,
        url: `https://medium.com/${entry.id}`,
        topic: deriveTopic('medium', title, tags),
        tags,
        ...(entry.firstPublishedAt
            ? { date: new Date(entry.firstPublishedAt).toISOString() }
            : {}),
        ...(entry.subtitle ? { summary: entry.subtitle } : {}),
        ...(entry.imageId
            ? {
                  image: `https://miro.medium.com/v2/resize:fit:640/${entry.imageId}`,
              }
            : {}),
    };
});

writeFileSync(SEED_PATH, `${JSON.stringify(seed, null, 4)}\n`);
console.log(`seeded ${seed.length} medium posts`, {
    dated: seed.filter((post) => post.date !== undefined).length,
    algo: seed.filter((post) => post.topic === 'algo').length,
    tech: seed.filter((post) => post.topic === 'tech').length,
});
