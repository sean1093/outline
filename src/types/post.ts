export type Source = 'medium' | 'blogger';

export type Topic = 'tech' | 'algo' | 'travel';

export interface Post {
    id: string;
    source: Source;
    title: string;
    url: string;
    topic: Topic;
    tags: string[];
    date?: string;
    summary?: string;
    image?: string;
    geo?: [number, number];
    lang?: 'en';
    // Set from overrides.json. Hiding is a presentation concern: the record
    // stays in data/posts.json so the accumulated archive is append-only, and
    // src/lib/posts.ts filters it out at read time.
    hidden?: true;
}

export interface Override {
    topic?: Topic;
    addTags?: string[];
    hidden?: true;
}

export type Overrides = Record<string, Override>;
