import { describe, expect, it } from 'vitest';
import { classifyTravelType } from '../src/lib/classify.ts';
import bloggerFeed from './fixtures/blogger.json';
import travelType from './fixtures/travel-type.json';

interface FeedEntry {
    title: { $t: string };
    category?: { term: string }[];
    link: { rel: string; href: string }[];
}

const entries = bloggerFeed.feed.entry as FeedEntry[];
const truth = travelType as Record<string, string>;

const pathOf = (entry: FeedEntry) =>
    new URL(entry.link.find((link) => link.rel === 'alternate')!.href).pathname;

const labelsOf = (entry: FeedEntry) =>
    (entry.category ?? []).map((category) => category.term);

describe('classifyTravelType', () => {
    it('reproduces all 55 hand-labelled posts with zero mistakes', () => {
        const wrong: string[] = [];
        let checked = 0;
        for (const entry of entries) {
            const expected = truth[pathOf(entry)];
            if (expected === undefined) continue;
            checked += 1;
            const actual = classifyTravelType(entry.title.$t, labelsOf(entry));
            if (actual !== expected) {
                wrong.push(`${pathOf(entry)}: want ${expected}, got ${actual}`);
            }
        }
        expect(checked).toBe(55);
        expect(wrong).toEqual([]);
    });

    it('gives every post in the feed a type', () => {
        const uncovered = entries
            .filter(
                (entry) =>
                    classifyTravelType(entry.title.$t, labelsOf(entry)) ===
                    undefined
            )
            .map((entry) => entry.title.$t);
        expect(uncovered).toEqual([]);
    });

    it('prefers a source label over the title', () => {
        expect(classifyTravelType('台南住宿 | 某飯店', ['台南', '美食'])).toBe(
            '美食'
        );
    });

    it('ignores type words after the second segment', () => {
        expect(
            classifyTravelType(
                '台南住宿 | 台南晶英酒店 | 客房介紹 | 飯店 bar',
                ['台南']
            )
        ).toBe('住宿');
    });

    it('finds the type in the second segment', () => {
        expect(
            classifyTravelType('關西自由行 | 大阪住宿 | 大阪東急卓越大酒店', [
                '大阪',
                '日本',
            ])
        ).toBe('住宿');
    });

    it('returns undefined when nothing matches', () => {
        expect(
            classifyTravelType('隨手筆記 | 沒有類型線索', ['台北'])
        ).toBeUndefined();
    });
});
