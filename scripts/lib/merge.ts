import type { Overrides, Post } from '../../src/types/post.ts';

export function comparePosts(a: Post, b: Post): number {
    if (a.date !== undefined && b.date !== undefined) {
        return b.date.localeCompare(a.date);
    }
    if (a.date !== undefined) return -1;
    if (b.date !== undefined) return 1;
    return a.title.localeCompare(b.title);
}

export function mergePosts(
    existing: Post[],
    incoming: Post[],
    overrides: Overrides = {}
): Post[] {
    const byId = new Map<string, Post>();
    for (const post of [...existing, ...incoming]) {
        const previous = byId.get(post.id);
        byId.set(
            post.id,
            previous === undefined
                ? { ...post }
                : {
                      ...previous,
                      ...post,
                      tags: [...new Set([...previous.tags, ...post.tags])],
                  }
        );
    }

    const merged: Post[] = [];
    for (const post of byId.values()) {
        const override = overrides[post.id];
        if (override?.hidden === true) continue;
        if (override?.topic !== undefined) post.topic = override.topic;
        if (override?.addTags !== undefined) {
            post.tags = [...new Set([...post.tags, ...override.addTags])];
        }
        merged.push(post);
    }
    return merged.sort(comparePosts);
}
