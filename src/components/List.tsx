import React from 'react';

type BlogPost = {
    title: string;
    link: string;
};

type ListProps = {
    domain: string;
    blogPosts: { [key: string]: BlogPost[] }; // 使用索引簽名型別
};

const List: React.FC<ListProps> = ({ domain, blogPosts }) => {
    return (
        <div>
            {Object.entries(blogPosts).map(([category, posts]) => (
                <div key={category}>
                    <h2>{category}</h2> {/* 顯示小標題 */}
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
