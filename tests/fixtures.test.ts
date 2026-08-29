import { describe, expect, it } from 'vitest';
import bloggerFeed from './fixtures/blogger.json';
import travelType from './fixtures/travel-type.json';

describe('fixtures', () => {
    it('blogger snapshot holds the whole blog', () => {
        expect(bloggerFeed.feed.entry).toHaveLength(134);
    });

    it('travel-type ground truth holds all 55 hand-labelled posts', () => {
        const entries = Object.entries(travelType as Record<string, string>);
        expect(entries).toHaveLength(55);
        expect(new Set(entries.map(([, type]) => type))).toEqual(
            new Set(['住宿', '景點', '酒吧'])
        );
    });

    it('every hand-labelled path exists in the feed', () => {
        const paths = new Set(
            bloggerFeed.feed.entry.map(
                (entry) =>
                    new URL(
                        entry.link.find(
                            (link) => link.rel === 'alternate'
                        )!.href
                    ).pathname
            )
        );
        const missing = Object.keys(travelType).filter(
            (path) => !paths.has(path)
        );
        expect(missing).toEqual([]);
    });
});
