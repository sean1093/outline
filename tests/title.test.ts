import { describe, expect, it } from 'vitest';
import { eyebrowAddsInformation, splitTitle } from '../src/lib/title.ts';
import { posts } from '../src/lib/posts.ts';

describe('splitTitle', () => {
    it('keeps a title that has no segments', () => {
        expect(splitTitle('AI 學習筆記 — LLM 底層原理淺談')).toEqual({
            name: 'AI 學習筆記 — LLM 底層原理淺談',
        });
    });

    it('takes the subject from the second segment and drops the keywords', () => {
        expect(
            splitTitle(
                '札幌住宿 | 札幌大通公園皇家花園康瓦斯飯店 The Royal Park Canvas | 房內直視札幌電視塔 | 地點超方便'
            )
        ).toEqual({
            eyebrow: '札幌住宿',
            name: '札幌大通公園皇家花園康瓦斯飯店 The Royal Park Canvas',
        });
    });

    it('tolerates an empty segment', () => {
        expect(
            splitTitle('北九州自由行 |  福岡住宿篇 | The Lively Hakata')
        ).toEqual({
            eyebrow: '北九州自由行',
            name: '福岡住宿篇',
        });
    });

    it('shortens every blogger title in the real index', () => {
        const blogger = posts.filter((post) => post.source === 'blogger');
        expect(blogger.length).toBeGreaterThanOrEqual(134);
        for (const post of blogger) {
            const { name } = splitTitle(post.title);
            expect(name).not.toBe('');
            expect(name.length).toBeLessThanOrEqual(post.title.length);
        }
        const before =
            blogger.reduce((sum, post) => sum + post.title.length, 0) /
            blogger.length;
        const after =
            blogger.reduce(
                (sum, post) => sum + splitTitle(post.title).name.length,
                0
            ) / blogger.length;
        // The whole point of the split: a list you can scan.
        expect(after).toBeLessThan(before / 2);
    });

    it('leaves medium titles untouched', () => {
        const medium = posts.filter((post) => post.source === 'medium');
        expect(medium.length).toBeGreaterThanOrEqual(81);
        for (const post of medium) {
            expect(splitTitle(post.title)).toEqual({ name: post.title });
        }
    });
});

describe('eyebrowAddsInformation', () => {
    it('rejects a prefix that only restates the tags', () => {
        expect(eyebrowAddsInformation('札幌住宿', ['札幌', '住宿'])).toBe(
            false
        );
        expect(eyebrowAddsInformation('北海道景點', ['北海道', '景點'])).toBe(
            false
        );
    });

    it('keeps a prefix carrying something no tag holds', () => {
        expect(
            eyebrowAddsInformation('星宇航空 STARLUX Airlines', [
                '北海道',
                '日本',
                '交通',
            ])
        ).toBe(true);
    });

    it('rejects an absent prefix', () => {
        expect(eyebrowAddsInformation(undefined, ['日本'])).toBe(false);
    });

    it('hides the prefix for most of the real index but keeps a few', () => {
        const shown = posts.filter((post) => {
            const { eyebrow } = splitTitle(post.title);
            return eyebrowAddsInformation(eyebrow, post.tags);
        });
        // Non-vacuous in both directions: the rule must filter, not pass all.
        expect(shown.length).toBeGreaterThan(0);
        expect(shown.length).toBeLessThan(
            posts.filter((post) => post.source === 'blogger').length / 2
        );
    });
});
