import type { Post, Topic } from '../types/post.ts';
import { COUNTRIES, splitPlaces, TRAVEL_TYPES } from './classify.ts';
import data from '../../data/posts.json';

export const posts = data as unknown as Post[];

export interface FacetValue {
    value: string;
    count: number;
}

export interface PostFilter {
    topic?: Topic;
    place?: string;
    type?: string;
    tag?: string;
    lang?: 'en';
    q?: string;
}

const normalize = (value: string) => value.normalize('NFKC').toLowerCase();

export function filterPosts(filter: PostFilter): Post[] {
    const query = filter.q === undefined ? '' : normalize(filter.q.trim());
    return posts.filter((post) => {
        const wantsEnglish = filter.lang === 'en';
        if (wantsEnglish !== (post.lang === 'en')) return false;
        if (filter.topic !== undefined && post.topic !== filter.topic)
            return false;
        for (const required of [filter.place, filter.type, filter.tag]) {
            if (required !== undefined && !post.tags.includes(required))
                return false;
        }
        if (query !== '') {
            const haystack = normalize(
                [post.title, post.summary ?? '', ...post.tags].join(' ')
            );
            if (!haystack.includes(query)) return false;
        }
        return true;
    });
}

export function latest(count: number): Post[] {
    return filterPosts({}).slice(0, count);
}

export function countsByTopic(): Record<Topic, number> {
    const counts: Record<Topic, number> = { tech: 0, algo: 0, travel: 0 };
    for (const post of filterPosts({})) counts[post.topic] += 1;
    return counts;
}

function tally(values: string[]): FacetValue[] {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function countryFacets(): FacetValue[] {
    return tally(
        filterPosts({ topic: 'travel' }).flatMap(
            (post) => splitPlaces(post.tags).countries
        )
    );
}

export function placeFacets(country: string): FacetValue[] {
    return tally(
        filterPosts({ topic: 'travel', place: country }).flatMap(
            (post) => splitPlaces(post.tags).places
        )
    );
}

export function typeFacets(): FacetValue[] {
    return tally(
        filterPosts({ topic: 'travel' }).flatMap((post) =>
            post.tags.filter((tag) => TRAVEL_TYPES.includes(tag))
        )
    );
}

export function tagFacets(topic: Topic, limit = 20): FacetValue[] {
    return tally(filterPosts({ topic }).flatMap((post) => post.tags)).slice(
        0,
        limit
    );
}

export function countryOfPlace(place: string): string | undefined {
    for (const post of filterPosts({ topic: 'travel', place })) {
        const country = post.tags.find((tag) => COUNTRIES.includes(tag));
        if (country !== undefined) return country;
    }
    return undefined;
}
