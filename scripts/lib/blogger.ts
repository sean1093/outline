import type { Post } from '../../src/types/post.ts';
import {
    classifyTravelType,
    deriveTopic,
    LANG_LABEL,
} from '../../src/lib/classify.ts';

export const BLOGGER_FEED =
    'https://travel-sean.blogspot.com/feeds/posts/default';

export interface BloggerEntry {
    title: { $t: string };
    published: { $t: string };
    content?: { $t: string };
    category?: { term: string }[];
    link: { rel: string; href: string }[];
    media$thumbnail?: { url: string };
    georss$point?: { $t: string };
}

export function upgradeThumb(url: string): string {
    return url.replace(/([=/])s72\b/, '$1s640');
}

export function summarize(html: string, max = 140): string {
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function parseGeo(entry: BloggerEntry): [number, number] | undefined {
    const raw = entry['georss$point']?.$t;
    if (raw === undefined) return undefined;
    const [lat, lng] = raw.split(' ').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
    return [lat, lng];
}

export function normalizeBlogger(entry: BloggerEntry): Post {
    const url = entry.link.find((link) => link.rel === 'alternate')!.href;
    const labels = (entry.category ?? []).map((category) => category.term);
    const type = classifyTravelType(entry.title.$t, labels);
    const tags = [
        ...labels.filter((label) => label !== LANG_LABEL),
        ...(type === undefined ? [] : [type]),
    ];
    const thumbnail = entry['media$thumbnail']?.url;
    const geo = parseGeo(entry);
    return {
        id: new URL(url).pathname,
        source: 'blogger',
        title: entry.title.$t,
        url,
        topic: deriveTopic('blogger', entry.title.$t, tags),
        tags: [...new Set(tags)],
        date: new Date(entry.published.$t).toISOString(),
        ...(entry.content ? { summary: summarize(entry.content.$t) } : {}),
        ...(thumbnail ? { image: upgradeThumb(thumbnail) } : {}),
        ...(geo ? { geo } : {}),
        ...(labels.includes(LANG_LABEL) ? { lang: 'en' as const } : {}),
    };
}

export async function fetchBlogger(): Promise<BloggerEntry[]> {
    const all: BloggerEntry[] = [];
    let start = 1;
    for (;;) {
        const response = await fetch(
            `${BLOGGER_FEED}?alt=json&max-results=150&start-index=${start}`
        );
        if (!response.ok) {
            throw new Error(`blogger feed responded ${response.status}`);
        }
        const body = (await response.json()) as {
            feed: { entry?: BloggerEntry[] };
        };
        const entries = body.feed.entry ?? [];
        // A later empty page is how pagination ends; an empty first page
        // means the feed carried no posts at all, which cannot be real.
        if (entries.length === 0) {
            if (all.length === 0) {
                throw new Error(
                    'blogger feed returned 0 entries on the first page'
                );
            }
            return all;
        }
        all.push(...entries);
        start += entries.length;
    }
}
