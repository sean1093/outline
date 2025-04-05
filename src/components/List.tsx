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
            {Object.entries(blogPosts).length === 0 && <div>資料尚未更新</div>}
            {Object.entries(blogPosts).map(([category, posts]) => (
                <div key={category} style={{ marginBottom: '24px' }}>
                    <h2 style={{ 
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        marginBottom: '16px',
                        color: 'var(--text-primary)'
                    }}>{category}</h2>
                    <ul style={{ 
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        {posts.map((post) => (
                            <li key={post.link} style={{
                                marginBottom: '12px',
                                paddingLeft: '24px',
                                position: 'relative'
                            }}>
                                <a
                                    href={`${domain}${post.link}?utm_source=personal_outline`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: 'var(--text-primary)',
                                        textDecoration: 'none',
                                        display: 'block',
                                        transition: 'color 0.2s ease'
                                    }}
                                    className="list-link"
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
