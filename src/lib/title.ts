export interface TitleParts {
    /** The `<region><type>` prefix, present only when it adds information. */
    eyebrow?: string;
    /** The subject of the post — what a reader scans for. */
    name: string;
}

/**
 * Blogger titles follow `<region><type> | <name> | <keyword> | <keyword>…`,
 * a convention that makes classification reliable and lists unreadable: the
 * full string averages 61 characters and reaches 137, while the second
 * segment — the actual subject — averages 13. Every Blogger title in the
 * corpus has at least two segments; no Medium title contains `|` at all, so
 * those pass through untouched.
 *
 * Segments after the second are SEO keywords ("房內直視札幌電視塔",
 * "地點超方便的文青飯店") and are dropped: the article itself is one click away.
 */
export function splitTitle(title: string): TitleParts {
    const segments = title
        .split('|')
        .map((segment) => segment.trim())
        .filter((segment) => segment !== '');
    if (segments.length < 2) return { name: title.trim() };
    return { eyebrow: segments[0], name: segments[1] };
}

/**
 * Most prefixes restate the post's own tags — `札幌住宿` against tags
 * `札幌` and `住宿` — so showing them would duplicate the metadata line.
 * A few carry information no tag holds (`星宇航空 STARLUX Airlines`), and
 * those are worth a line.
 */
export function eyebrowAddsInformation(
    eyebrow: string | undefined,
    tags: string[]
): eyebrow is string {
    if (eyebrow === undefined) return false;
    return !tags.some((tag) => eyebrow.includes(tag));
}
