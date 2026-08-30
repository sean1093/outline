import React from 'react';
import type { Post } from '../types/post.ts';
import { withUtm } from '../lib/url.ts';
import { eyebrowAddsInformation, splitTitle } from '../lib/title.ts';
import { theme } from '../styles/theme';

const SOURCE_LABEL: Record<Post['source'], string> = {
    medium: 'Medium',
    blogger: 'Blog',
};

/**
 * Five tags on one line out-weighed the title they described. Three is
 * enough to place a post; the rest are one click away.
 */
const MAX_TAGS = 3;

const PostList: React.FC<{ posts: Post[] }> = ({ posts }) => {
    if (posts.length === 0) {
        return (
            <p style={{ color: theme.colors.textSecondary }}>
                沒有符合條件的文章
            </p>
        );
    }
    return (
        <ul
            style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.lg,
            }}
        >
            {posts.map((post) => {
                const { eyebrow, name } = splitTitle(post.title);
                return (
                    <li
                        key={post.id}
                        style={{
                            display: 'flex',
                            gap: theme.spacing.md,
                            alignItems: 'flex-start',
                        }}
                    >
                        {post.image !== undefined && (
                            <img
                                src={post.image}
                                alt=""
                                loading="lazy"
                                className="post-thumb"
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    flexShrink: 0,
                                    background: theme.colors.border,
                                }}
                            />
                        )}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: theme.spacing.xs,
                            }}
                        >
                            {eyebrowAddsInformation(eyebrow, post.tags) && (
                                <span
                                    style={{
                                        ...theme.typography.small,
                                        color: theme.colors.textMuted,
                                    }}
                                >
                                    {eyebrow}
                                </span>
                            )}
                            <a
                                className="list-link"
                                href={withUtm(post.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    ...theme.typography.body,
                                    fontWeight: '600',
                                    // No `color` here on purpose: `.list-link` in
                                    // index.css sets the identical resting colour,
                                    // and an inline one would outrank
                                    // `.list-link:hover`.
                                    textDecoration: 'none',
                                }}
                            >
                                {name}
                            </a>
                            <span
                                style={{
                                    ...theme.typography.small,
                                    color: theme.colors.textSecondary,
                                }}
                            >
                                {post.date?.slice(0, 10) ?? '日期不明'} ·{' '}
                                {SOURCE_LABEL[post.source]}
                                {post.tags.length > 0 &&
                                    ` · ${post.tags.slice(0, MAX_TAGS).join('、')}`}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default PostList;
