import { describe, expect, it } from 'vitest';
import { splitPlaces } from '../src/lib/classify.ts';

describe('splitPlaces', () => {
    it('separates countries from places', () => {
        expect(splitPlaces(['北海道', '日本', '札幌'])).toEqual({
            countries: ['日本'],
            places: ['北海道', '札幌'],
        });
    });

    it('keeps country-only posts free of places', () => {
        expect(splitPlaces(['台灣'])).toEqual({
            countries: ['台灣'],
            places: [],
        });
    });

    it('keeps every country of a cross-country post', () => {
        expect(
            splitPlaces(['台灣', '日本', '澳洲', '馬來西亞', '酒吧']).countries
        ).toEqual(['台灣', '日本', '澳洲', '馬來西亞']);
    });

    it('never counts a travel type as a place', () => {
        expect(splitPlaces(['台北', '台灣', '住宿']).places).toEqual(['台北']);
    });
});
