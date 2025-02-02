import React from 'react';

type BlogPost = {
    title: string;
    link: string;
};

type ListProps = {
    domain: string;
    blogPosts: { [key: string]: BlogPost[] };
};

const List: React.FC<ListProps> = ({ domain, blogPosts }) => {
    return (
        <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
            {Object.entries(blogPosts).map(([category, posts]) => (
                <div key={category}>
                    <h2>{category}</h2>
                    <ul>
                        {posts.map((post) => (
                            <li key={post.link}>
                                <a
                                    href={`${domain}${post.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {post.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default List;
