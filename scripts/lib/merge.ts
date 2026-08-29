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
        // Mark, never drop: posts.json is this script's own prior state, so
        // filtering here would erase the record from the accumulated archive
        // rather than hide it. src/lib/posts.ts drops hidden posts at read time.
        //
        // Assigned unconditionally, and this is the one place an explicit
        // `undefined` is correct. A record hidden by a past override comes back
        // in `existing` still carrying the flag, and an incoming feed record has
        // no `hidden` key to overwrite it with, so `{ ...previous, ...post }`
        // would carry it forward forever and removing the override would never
        // un-hide the post. `JSON.stringify` drops undefined, so the artefact
        // stays clean.
        post.hidden = override?.hidden === true ? true : undefined;
        if (override?.topic !== undefined) post.topic = override.topic;
        if (override?.addTags !== undefined) {
            post.tags = [...new Set([...post.tags, ...override.addTags])];
        }
        merged.push(post);
    }
    return merged.sort(comparePosts);
}
