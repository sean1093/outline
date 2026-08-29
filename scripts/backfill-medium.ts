/**
 * One-off history backfill. NOT part of the daily `yarn sync` pipeline — it is
 * kept only as a record of how `data/seed.medium.json` was produced.
 *
 * Medium's RSS feed serves the 10 most recent posts and nothing older, so the
 * 71 earlier articles were recovered once and frozen into the seed file, which
 * `scripts/sync.ts` then merges as prior state on every run.
 *
 * That seed is the only surviving copy of those 71 posts, and `sync.ts` builds
 * its `existing` list as `[...posts.json, ...seed]`, so the seed wins on every
 * field it carries. A metadata-empty entry would therefore not merely be thin,
 * it would overwrite good data: 23 of the 35 `algo` posts here are classified
 * purely by their Medium tags (`9. Palindrome Number` and friends do not match
 * `deriveTopic`'s title regex), so an entry that lost its tags would silently
 * demote itself to `tech` with no facets on the next sync. Hence the guards
 * below — this tool refuses to write a degraded or shorter seed.
 *
 * It reads two intermediate files, deleted once the seed exists:
 *
 * - `data/medium-ids.json` — `IdEntry[]`, one entry per unique `/p/<id>` link
 *   in the hand-maintained link lists that used to live in `src/config/`. Ids
 *   repeat across those lists, so they must be collapsed by id. Those titles
 *   were shortened by hand for the index and are kept verbatim; Medium's
 *   canonical titles are longer and less useful here.
 *
 * - `data/medium-raw.json` — `RawEntry[]`, one entry per id in the same order,
 *   written by the capture block below.
 *
 * Neither file is in the repo, so this tool exits at `ENOENT` until a capture
 * is re-run. `.superpowers/**` is gitignored, so the block below is the whole
 * record of the half that talks to Medium: it is the exact code that was run,
 * and it is meant to be pasted as-is.
 */

/*
=== CAPTURE: how to rebuild `data/medium-raw.json` ===

Reproduced exactly as executed, so its style deviates from this repo's rules on
purpose: `await import()` because the driver evaluates the block as an async
function body with no static import site, and executor-form `new Promise` for
the delay. Left unmodified because this is the version known to work against
the live endpoint, and re-verifying an edited one costs another browser session.

Environment. All three are mandatory; the capture returns nothing useful if any
is missing:

  1. Headful Chrome. Headless lands on a Cloudflare interstitial — page title
     `Attention Required! | Cloudflare` — and every fetch fails.
  2. An isolated profile: `--user-data-dir=/tmp/omp-chrome-backfill
     --no-first-run --no-default-browser-check`. Launching Chrome while the
     user's own Chrome is running otherwise hands the request to that existing
     process and the CDP attach times out.
  3. A page already on the `medium.com` origin — open
     `https://medium.com/@sean1093`, which settles on
     `https://sean1093.medium.com/`. `medium.com/p/<id>?format=json` answers 403
     to curl and to every plain fetcher; from that origin it answers 200.

The snippet runs in the browser-driver (Node) context and reaches the page only
through `tab.evaluate(fn, arg)`. `fn` is serialized into the page, so it closes
over nothing here and the batch must travel as the second argument.

Batches of 10 keep any single evaluation well inside puppeteer's 180s
`protocolTimeout`; all 71 ids in one evaluation (71 x (fetch + 300ms)) does not
fit. Writing after each batch keeps partial progress if a batch dies.

Paste from here:

const { readFileSync, writeFileSync } = await import('node:fs');

// Evaluated inside the page. One try/catch per id, so a single failure records
// `{ id, error }` and the sweep continues; the 300ms spacing keeps Medium from
// rate-limiting it.
const grab = async (entries) => {
    const out = [];
    for (const entry of entries) {
        const postId = entry.id.replace(/^p\//, '');
        try {
            const response = await fetch(
                `https://medium.com/p/${postId}?format=json`,
                { credentials: 'omit' }
            );
            const text = await response.text();
            // Anti-hijacking guard prefix `])}while(1);</x>`; JSON.parse fails
            // on the body until it is stripped.
            const json = JSON.parse(text.replace(/^\]\)\}while\(1\);<\/x>/, ''));
            const value = json.payload.value;
            const virtuals = value.virtuals ?? {};
            out.push({
                id: entry.id,
                status: response.status,
                firstPublishedAt: value.firstPublishedAt,
                tags: (virtuals.tags ?? []).map((tag) => tag.slug),
                subtitle: virtuals.subtitle ?? null,
                imageId: virtuals.previewImage?.imageId ?? null,
            });
        } catch (error) {
            out.push({ id: entry.id, error: String(error) });
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return out;
};

const ids = JSON.parse(readFileSync('data/medium-ids.json', 'utf8'));
const fetched = [];
for (let i = 0; i < ids.length; i += 10) {
    fetched.push(...(await tab.evaluate(grab, ids.slice(i, i + 10))));
    writeFileSync(
        'data/medium-raw.json',
        JSON.stringify(fetched, null, 4) + '\n'
    );
}
return {
    total: fetched.length,
    failed: fetched.filter((e) => e.error !== undefined || e.status !== 200)
        .length,
};

To here. Expect `{ total: 71, failed: 0 }`. Re-run the failed ids on their own
before running this tool: it rejects any entry that did not come back 200.
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
    status?: number;
    error?: string;
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
    if (entry.error !== undefined || entry.status !== 200) {
        throw new Error(
            `${RAW_PATH} has no usable capture for ${entry.id}: status=${String(entry.status)}, error=${String(entry.error)}. Re-capture that id; seeding it would publish an undated, untagged post over good data.`
        );
    }
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

let previous = 0;
try {
    previous = (JSON.parse(readFileSync(SEED_PATH, 'utf8')) as Post[]).length;
} catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
if (seed.length < previous) {
    throw new Error(
        `refusing to shrink ${SEED_PATH} from ${previous} to ${seed.length} posts. Medium's feed cannot serve these back, so restore the missing captures in ${RAW_PATH} first.`
    );
}

writeFileSync(SEED_PATH, `${JSON.stringify(seed, null, 4)}\n`);
console.log(`seeded ${seed.length} medium posts`, {
    dated: seed.filter((post) => post.date !== undefined).length,
    untagged: seed.filter((post) => post.tags.length === 0).length,
    algo: seed.filter((post) => post.topic === 'algo').length,
    tech: seed.filter((post) => post.topic === 'tech').length,
});
