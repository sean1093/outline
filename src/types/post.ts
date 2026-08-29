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
}

export interface Override {
    topic?: Topic;
    addTags?: string[];
    hidden?: true;
}

export type Overrides = Record<string, Override>;
