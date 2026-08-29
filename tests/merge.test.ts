import { describe, expect, it } from 'vitest';
import type { Post } from '../src/types/post.ts';
import { mergePosts } from '../scripts/lib/merge.ts';

const post = (over: Partial<Post> & Pick<Post, 'id'>): Post => ({
    source: 'medium',
    title: `title ${over.id}`,
    url: `https://medium.com/${over.id}`,
    topic: 'tech',
    tags: [],
    ...over,
});

describe('mergePosts', () => {
    it('keeps posts the feed no longer returns', () => {
        const merged = mergePosts(
            [post({ id: 'p/old', date: '2020-01-01T00:00:00.000Z' })],
            [post({ id: 'p/new', date: '2026-01-01T00:00:00.000Z' })]
        );
        expect(merged.map((entry) => entry.id)).toEqual(['p/new', 'p/old']);
    });

    it('lets the feed refresh fields but unions tags', () => {
        const merged = mergePosts(
            [post({ id: 'p/x', title: 'old title', tags: ['seeded'] })],
            [post({ id: 'p/x', title: 'new title', tags: ['leetcode'] })]
        );
        expect(merged).toHaveLength(1);
        expect(merged[0].title).toBe('new title');
        expect(merged[0].tags).toEqual(['seeded', 'leetcode']);
    });

    it('never lets an absent field erase a present one', () => {
        const merged = mergePosts(
            [post({ id: 'p/x', date: '2021-06-21T12:57:43.476Z' })],
            [post({ id: 'p/x' })]
        );
        expect(merged[0].date).toBe('2021-06-21T12:57:43.476Z');
    });

    it('dedupes a post that appears twice in one batch', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'p/5bc7be208eac', tags: ['two-pointers'] }),
                post({ id: 'p/5bc7be208eac', tags: ['greedy'] }),
            ]
        );
        expect(merged).toHaveLength(1);
        expect(merged[0].tags).toEqual(['two-pointers', 'greedy']);
    });

    it('applies overrides', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'a', tags: ['英文版本-less'] }),
                post({ id: 'b' }),
                post({ id: 'c' }),
            ],
            {
                a: { addTags: ['台灣', '台北'] },
                b: { topic: 'travel' },
                c: { hidden: true },
            }
        );
        expect(merged.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
        expect(merged[0].tags).toEqual(['英文版本-less', '台灣', '台北']);
        expect(merged[1].topic).toBe('travel');
    });

    it('marks a hidden post instead of erasing it from the archive', () => {
        const merged = mergePosts([post({ id: 'p/keep' })], [], {
            'p/keep': { hidden: true },
        });
        expect(merged.map((entry) => entry.id)).toEqual(['p/keep']);
        expect(merged[0].hidden).toBe(true);
    });

    it('leaves posts unmarked when no override hides them', () => {
        const merged = mergePosts([], [post({ id: 'p/plain' })], {
            'p/plain': { topic: 'travel' },
        });
        expect(merged[0].hidden).toBeUndefined();
    });

    it('sorts dated posts first, newest first, undated by title', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'z', title: 'zzz' }),
                post({ id: 'a', title: 'aaa' }),
                post({ id: 'old', date: '2020-01-01T00:00:00.000Z' }),
                post({ id: 'new', date: '2026-01-01T00:00:00.000Z' }),
            ]
        );
        expect(merged.map((entry) => entry.id)).toEqual([
            'new',
            'old',
            'a',
            'z',
        ]);
    });
});
