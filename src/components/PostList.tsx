import React from 'react';
import type { Post } from '../types/post.ts';
import { withUtm } from '../lib/url.ts';
import { theme } from '../styles/theme';

const SOURCE_LABEL: Record<Post['source'], string> = {
    medium: 'Medium',
    blogger: 'Blog',
};

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
            {posts.map((post) => (
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
                            width={112}
                            height={84}
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
                        <a
                            className="list-link"
                            href={withUtm(post.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...theme.typography.body,
                                fontWeight: '600',
                                color: theme.colors.textPrimary,
                                textDecoration: 'none',
                            }}
                        >
                            {post.title}
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
                                ` · ${post.tags.join('、')}`}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default PostList;
