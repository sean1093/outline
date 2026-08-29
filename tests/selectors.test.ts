import { describe, expect, it } from 'vitest';
import { withUtm } from '../src/lib/url.ts';
import {
    countryFacets,
    countryOfPlace,
    countsByTopic,
    filterPosts,
    latest,
    placeFacets,
    posts,
    tagFacets,
    typeFacets,
} from '../src/lib/posts.ts';

describe('withUtm', () => {
    it('adds the utm source', () => {
        expect(withUtm('https://medium.com/p/abc')).toBe(
            'https://medium.com/p/abc?utm_source=personal_outline'
        );
    });

    it('keeps an existing query intact', () => {
        expect(withUtm('https://example.com/a?ref=x')).toBe(
            'https://example.com/a?ref=x&utm_source=personal_outline'
        );
    });
});

describe('posts data', () => {
    it('ships the whole index with unique ids', () => {
        expect(posts.length).toBeGreaterThanOrEqual(205);
        expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length);
    });

    it('is sorted newest first', () => {
        const dated = posts.filter((post) => post.date !== undefined);
        const sorted = [...dated].sort((a, b) =>
            b.date!.localeCompare(a.date!)
        );
        expect(dated.map((post) => post.id)).toEqual(
            sorted.map((post) => post.id)
        );
    });
});

describe('filterPosts', () => {
    it('hides english translations by default and shows them on request', () => {
        expect(filterPosts({}).filter((post) => post.lang === 'en')).toEqual(
            []
        );
        expect(filterPosts({ lang: 'en' })).toHaveLength(4);
    });

    it('combines place and type', () => {
        const kyotoBars = filterPosts({
            topic: 'travel',
            place: '京都',
            type: '酒吧',
        });
        expect(kyotoBars.length).toBeGreaterThan(0);
        for (const post of kyotoBars) {
            expect(post.tags).toContain('京都');
            expect(post.tags).toContain('酒吧');
        }
    });

    it('searches title, tags and summary', () => {
        const hits = filterPosts({ q: '京都' });
        expect(hits.length).toBeGreaterThan(0);
        expect(filterPosts({ q: 'LEETCODE' }).length).toBeGreaterThan(0);
    });
});

describe('facets', () => {
    it('counts the five countries', () => {
        const counts = Object.fromEntries(
            countryFacets().map((facet) => [facet.value, facet.count])
        );
        expect(counts['日本']).toBeGreaterThanOrEqual(50);
        expect(counts['台灣']).toBeGreaterThanOrEqual(44);
        expect(counts['澳洲']).toBeGreaterThanOrEqual(24);
        expect(counts['馬來西亞']).toBeGreaterThanOrEqual(11);
        expect(counts['泰國']).toBe(4);
    });

    it('lists the places of a country', () => {
        expect(placeFacets('日本').length).toBeGreaterThanOrEqual(18);
        expect(placeFacets('台灣').length).toBeGreaterThanOrEqual(11);
        expect(placeFacets('泰國').map((facet) => facet.value)).toContain(
            '曼谷'
        );
    });

    it('resolves the country of a place from the data', () => {
        expect(countryOfPlace('京都')).toBe('日本');
        expect(countryOfPlace('台北')).toBe('台灣');
        expect(countryOfPlace('不存在的地方')).toBeUndefined();
    });

    it('counts travel types', () => {
        const counts = Object.fromEntries(
            typeFacets().map((facet) => [facet.value, facet.count])
        );
        expect(counts['住宿']).toBeGreaterThanOrEqual(45);
        expect(counts['景點']).toBeGreaterThanOrEqual(29);
        expect(counts['交通']).toBeGreaterThanOrEqual(1);
    });

    it('caps tech tags to the most common ones', () => {
        expect(tagFacets('tech', 20).length).toBeLessThanOrEqual(20);
    });
});

describe('home data', () => {
    it('returns the newest posts across sources', () => {
        const newest = latest(10);
        expect(newest).toHaveLength(10);
        expect(newest.every((post) => post.lang !== 'en')).toBe(true);
    });

    it('counts all three topics', () => {
        const counts = countsByTopic();
        expect(counts.travel).toBeGreaterThanOrEqual(130);
        expect(counts.tech + counts.algo).toBeGreaterThanOrEqual(71);
    });
});
