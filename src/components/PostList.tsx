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
        <ul className="post-list">
            {posts.map((post) => {
                const { eyebrow, name } = splitTitle(post.title);
                return (
                    <li key={post.id}>
                        {post.image !== undefined && (
                            <img
                                className="post-thumb"
                                src={post.image}
                                alt=""
                                loading="lazy"
                            />
                        )}
                        <div className="post-body">
                            {eyebrowAddsInformation(eyebrow, post.tags) && (
                                <span className="post-eyebrow">{eyebrow}</span>
                            )}
                            <a
                                className="post-title"
                                href={withUtm(post.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {name}
                            </a>
                            <span className="post-meta">
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
