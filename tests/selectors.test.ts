import type { Post } from '../src/types/post.ts';
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
        expect(filterPosts({ lang: 'en' }).length).toBeGreaterThanOrEqual(4);
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
        expect(counts['泰國']).toBeGreaterThanOrEqual(4);
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

    it('orders countries by descending count', () => {
        const counts = countryFacets().map((facet) => facet.count);
        expect(counts).toEqual([...counts].sort((a, b) => b - a));
    });

    it('counts facets over the visible corpus, not the raw index', () => {
        const rawTravel = posts.filter((post) => post.topic === 'travel');
        const visibleTravel = filterPosts({ topic: 'travel' });
        expect(rawTravel.length).toBeGreaterThan(visibleTravel.length);

        const tagged = (corpus: Post[], tag: string) =>
            corpus.filter((post) => post.tags.includes(tag)).length;

        // The English half of the blog names its facets in English. Those rows
        // are in the index but invisible in the default Chinese view, so a
        // facet built from the raw index would leak them into the Chinese
        // chips — which is exactly what these selectors must not do.
        expect(tagged(rawTravel, 'Accommodation')).toBeGreaterThan(0);
        expect(tagged(visibleTravel, 'Accommodation')).toBe(0);
        expect(countryFacets('en')).toEqual([]);

        const types = Object.fromEntries(
            typeFacets().map((facet) => [facet.value, facet.count])
        );
        expect(types['Accommodation']).toBeUndefined();
        expect(types['住宿']).toBe(tagged(visibleTravel, '住宿'));

        const countries = Object.fromEntries(
            countryFacets().map((facet) => [facet.value, facet.count])
        );
        expect(countries['Taiwan']).toBeUndefined();
        expect(countries['台灣']).toBe(tagged(visibleTravel, '台灣'));
    });

    it('builds the english facets from the english corpus alone', () => {
        const english = filterPosts({ topic: 'travel', lang: 'en' });
        expect(english.length).toBeGreaterThan(0);
        const chinese = /[\u4e00-\u9fff]/;
        const leaked = english.flatMap((post) =>
            post.tags.filter((tag) => chinese.test(tag))
        );
        expect(leaked).toEqual([]);
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

describe('hidden posts', () => {
    // `hidden` marks the record in data/posts.json rather than removing it, so
    // the exclusion has to happen here. Inserting into the loaded index is the
    // only way to exercise it: no override currently sets `hidden`, so an
    // assertion over the committed data alone would pass vacuously.
    it('stay in the index but out of every selector and facet count', () => {
        const hidden: Post = {
            id: 'test/hidden',
            source: 'blogger',
            title: '測試用隱藏文章',
            url: 'https://example.com/hidden',
            topic: 'travel',
            tags: ['泰國', '曼谷', '住宿'],
            date: '2099-01-01T00:00:00.000Z',
            hidden: true,
        };
        const thaiBefore = countryFacets().find(
            (facet) => facet.value === '泰國'
        )!.count;
        const bangkokBefore = placeFacets('泰國').find(
            (facet) => facet.value === '曼谷'
        )!.count;
        const travelBefore = countsByTopic().travel;

        // Inserted at the head, which is where a post dated 2099 really lands
        // in the sorted artefact. `latest` slices `filterPosts({})` without
        // sorting, so appending at the tail instead would make the `latest`
        // assertion below pass no matter what the filter did.
        posts.unshift(hidden);
        try {
            expect(posts).toContain(hidden);
            expect(filterPosts({})).not.toContain(hidden);
            expect(
                filterPosts({ topic: 'travel', place: '曼谷' })
            ).not.toContain(hidden);
            expect(filterPosts({ q: '測試用隱藏文章' })).toEqual([]);
            expect(latest(10)).not.toContain(hidden);
            expect(latest(10)).toHaveLength(10);
            expect(
                countryFacets().find((facet) => facet.value === '泰國')!.count
            ).toBe(thaiBefore);
            expect(
                placeFacets('泰國').find((facet) => facet.value === '曼谷')!
                    .count
            ).toBe(bangkokBefore);
            expect(countsByTopic().travel).toBe(travelBefore);
        } finally {
            posts.shift();
        }
        expect(posts).not.toContain(hidden);
    });
});
