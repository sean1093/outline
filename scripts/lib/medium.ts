import { XMLParser } from 'fast-xml-parser';
import type { Post } from '../../src/types/post.ts';
import { deriveTopic } from '../../src/lib/classify.ts';
import { summarize } from './blogger.ts';

export const MEDIUM_FEED = 'https://medium.com/feed/@sean1093';

export interface MediumItem {
    title: string;
    guid: string;
    pubDate: string;
    category?: string | string[];
    'content:encoded'?: string;
}

export function parseMediumXml(xml: string): MediumItem[] {
    const parsed = new XMLParser({ ignoreAttributes: true }).parse(xml) as {
        rss?: { channel?: { item?: MediumItem | MediumItem[] } };
    };
    const item = parsed.rss?.channel?.item;
    if (item === undefined) return [];
    return Array.isArray(item) ? item : [item];
}

export function normalizeMedium(item: MediumItem): Post {
    const id = `p/${item.guid.split('/').pop()!}`;
    const tags =
        item.category === undefined
            ? []
            : Array.isArray(item.category)
              ? item.category
              : [item.category];
    const html = item['content:encoded'] ?? '';
    const image = html.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const summary = html === '' ? undefined : summarize(html);
    return {
        id,
        source: 'medium',
        title: item.title,
        url: `https://medium.com/${id}`,
        topic: deriveTopic('medium', item.title, tags),
        tags,
        date: new Date(item.pubDate).toISOString(),
        ...(summary ? { summary } : {}),
        ...(image ? { image } : {}),
    };
}

export async function fetchMedium(): Promise<MediumItem[]> {
    const response = await fetch(MEDIUM_FEED);
    if (!response.ok) {
        throw new Error(`medium feed responded ${response.status}`);
    }
    return parseMediumXml(await response.text());
}
