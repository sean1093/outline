import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    normalizeBlogger,
    summarize,
    upgradeThumb,
    type BloggerEntry,
} from '../scripts/lib/blogger.ts';
import {
    normalizeMedium,
    parseMediumXml,
    type MediumItem,
} from '../scripts/lib/medium.ts';
import bloggerFeed from './fixtures/blogger.json';

const entries = bloggerFeed.feed.entry as unknown as BloggerEntry[];

describe('upgradeThumb', () => {
    it('upgrades the trailing size token', () => {
        expect(
            upgradeThumb(
                'https://lh3.googleusercontent.com/pw/AAA=s72-w640-h512-c'
            )
        ).toBe('https://lh3.googleusercontent.com/pw/AAA=s640-w640-h512-c');
    });

    it('upgrades a path-style size token', () => {
        expect(
            upgradeThumb(
                'https://blogger.googleusercontent.com/img/x/s72-w640-h512-c/'
            )
        ).toBe('https://blogger.googleusercontent.com/img/x/s640-w640-h512-c/');
    });

    it('rewrites exactly one token per url', () => {
        const upgraded = entries.map((entry) =>
            upgradeThumb(entry['media$thumbnail']!.url)
        );
        expect(upgraded.filter((url) => url.includes('s72'))).toEqual([]);
        expect(upgraded.filter((url) => url.includes('s640'))).toHaveLength(
            entries.length
        );
    });
});

describe('summarize', () => {
    it('strips markup and collapses whitespace', () => {
        expect(summarize('<div>  hello <b>world</b>\n</div>')).toBe(
            'hello world'
        );
    });

    it('truncates with an ellipsis', () => {
        expect(summarize('x'.repeat(200))).toHaveLength(141);
    });
});

describe('normalizeBlogger', () => {
    const post = normalizeBlogger(
        entries.find(
            (entry) =>
                entry.link.find((link) => link.rel === 'alternate')!.href ===
                'https://travel-sean.blogspot.com/2022/12/regent-taipei.html'
        )!
    );

    it('uses the article path as id and keeps the absolute url', () => {
        expect(post.id).toBe('/2022/12/regent-taipei.html');
        expect(post.url).toBe(
            'https://travel-sean.blogspot.com/2022/12/regent-taipei.html'
        );
    });

    it('always lands in travel and carries a derived type tag', () => {
        expect(post.topic).toBe('travel');
        expect(post.tags).toContain('住宿');
        expect(post.tags).toContain('台北');
    });

    it('normalizes the date to UTC iso', () => {
        expect(post.date).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        );
    });

    it('never emits the language label as a tag', () => {
        const english = entries.filter((entry) =>
            (entry.category ?? []).some(
                (category) => category.term === '英文版本'
            )
        );
        expect(english).toHaveLength(4);
        for (const entry of english) {
            const normalized = normalizeBlogger(entry);
            expect(normalized.lang).toBe('en');
            expect(normalized.tags).not.toContain('英文版本');
        }
    });

    it('normalizes every entry in the feed', () => {
        const posts = entries.map(normalizeBlogger);
        expect(posts).toHaveLength(134);
        expect(posts.filter((post) => post.date === undefined)).toEqual([]);
        expect(posts.filter((post) => post.image === undefined)).toEqual([]);
        expect(new Set(posts.map((post) => post.id)).size).toBe(134);
    });

    it('reads the geo point when present', () => {
        const withGeo = entries
            .map(normalizeBlogger)
            .filter((post) => post.geo);
        expect(withGeo.length).toBeGreaterThan(120);
        for (const post of withGeo.slice(0, 5)) {
            expect(post.geo).toHaveLength(2);
            expect(Number.isFinite(post.geo![0])).toBe(true);
        }
    });
});

describe('normalizeMedium', () => {
    const item: MediumItem = {
        title: '[LeetCode 解題紀錄] 139. Word Break',
        guid: 'https://medium.com/p/ad188926d9ef',
        pubDate: 'Wed, 04 Mar 2026 12:00:00 GMT',
        category: ['leetcode', 'dynamic-programming'],
        'content:encoded':
            '<figure><img src="https://miro.medium.com/v2/1*abc.png" /></figure><p>解題思路</p>',
    };

    it('derives id and canonical url from guid', () => {
        const post = normalizeMedium(item);
        expect(post.id).toBe('p/ad188926d9ef');
        expect(post.url).toBe('https://medium.com/p/ad188926d9ef');
    });

    it('carries tags, topic, date and first image', () => {
        const post = normalizeMedium(item);
        expect(post.topic).toBe('algo');
        expect(post.tags).toEqual(['leetcode', 'dynamic-programming']);
        expect(post.date).toBe('2026-03-04T12:00:00.000Z');
        expect(post.image).toBe('https://miro.medium.com/v2/1*abc.png');
        expect(post.summary).toBe('解題思路');
    });

    it('accepts a single category as a string', () => {
        const post = normalizeMedium({ ...item, category: 'leetcode' });
        expect(post.tags).toEqual(['leetcode']);
    });

    it('parses the real rss snapshot', () => {
        const items = parseMediumXml(
            readFileSync('tests/fixtures/medium.xml', 'utf8')
        );
        expect(items).toHaveLength(10);
        const posts = items.map(normalizeMedium);
        expect(posts.every((post) => post.id.startsWith('p/'))).toBe(true);
        expect(posts.filter((post) => post.date === undefined)).toEqual([]);
        expect(
            posts.filter((post) => post.topic === 'algo').length
        ).toBeGreaterThan(0);
    });

    it('keeps numeric-looking titles and tags as strings', () => {
        const items = parseMediumXml(
            '<rss><channel><item>' +
                '<title>2026</title>' +
                '<guid>https://medium.com/p/00ff</guid>' +
                '<pubDate>Wed, 04 Mar 2026 12:00:00 GMT</pubDate>' +
                '<category>2026</category>' +
                '<category>ai</category>' +
                '</item></channel></rss>'
        );
        expect(items).toHaveLength(1);
        const post = normalizeMedium(items[0]);
        expect(post.tags).toEqual(['2026', 'ai']);
        expect(post.tags.map((tag) => typeof tag)).toEqual([
            'string',
            'string',
        ]);
        expect(post.title).toBe('2026');
        expect(typeof post.title).toBe('string');
    });
});
