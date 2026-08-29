import { readFileSync, writeFileSync } from 'node:fs';
import type { Overrides, Post } from '../src/types/post.ts';
import { fetchBlogger, normalizeBlogger } from './lib/blogger.ts';
import { fetchMedium, normalizeMedium } from './lib/medium.ts';
import { mergePosts } from './lib/merge.ts';

const POSTS_PATH = 'data/posts.json';
const SEED_PATH = 'data/seed.medium.json';
const OVERRIDES_PATH = 'data/overrides.json';

function readJson<T>(path: string, fallback: T): T {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
        throw error;
    }
}

const [bloggerEntries, mediumItems] = await Promise.all([
    fetchBlogger(),
    fetchMedium(),
]);

const incoming = [
    ...bloggerEntries.map(normalizeBlogger),
    ...mediumItems.map(normalizeMedium),
];
const existing = [
    ...readJson<Post[]>(POSTS_PATH, []),
    ...readJson<Post[]>(SEED_PATH, []),
];
const overrides = readJson<Overrides>(OVERRIDES_PATH, {});
const merged = mergePosts(existing, incoming, overrides);

writeFileSync(POSTS_PATH, `${JSON.stringify(merged, null, 4)}\n`);

const counts = merged.reduce<Record<string, number>>((acc, post) => {
    acc[post.source] = (acc[post.source] ?? 0) + 1;
    acc[post.topic] = (acc[post.topic] ?? 0) + 1;
    return acc;
}, {});
console.log(`wrote ${merged.length} posts`, counts);
