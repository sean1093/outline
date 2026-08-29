import { useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import PostList from '../components/PostList';
import { countsByTopic, filterPosts, latest } from '../lib/posts.ts';
import { theme } from '../styles/theme';

const TOPICS = [
    {
        topic: 'tech' as const,
        title: 'Tech',
        emoji: '🛠',
        description: '軟體開發、前端、雲端與 AI 學習筆記',
    },
    {
        topic: 'algo' as const,
        title: 'Algorithm',
        emoji: '🧠',
        description: '演算法筆記與 LeetCode 解題紀錄',
    },
    {
        topic: 'travel' as const,
        title: 'Travel',
        emoji: '✈️',
        description: '住宿、景點、美食與酒吧踩點紀錄',
    },
];

const Home = () => {
    const [query, setQuery] = useState('');
    const counts = countsByTopic();
    const trimmed = query.trim();
    const results = trimmed === '' ? [] : filterPosts({ q: trimmed });

    return (
        <Section>
            <h1
                style={{
                    ...theme.typography.h1,
                    color: theme.colors.textPrimary,
                }}
            >
                Sean 的文章索引
            </h1>
            <p
                style={{
                    ...theme.typography.body,
                    color: theme.colors.textSecondary,
                }}
            >
                散落在 Medium 與 Blogger 的文章，集中在這裡。
            </p>

            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋標題、標籤或摘要"
                style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.lg,
                    borderRadius: '12px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.surface,
                    ...theme.typography.body,
                }}
            />

            {trimmed === '' ? (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: theme.spacing.lg,
                            marginTop: theme.spacing.xl,
                        }}
                    >
                        {TOPICS.map((entry) => (
                            <Card
                                key={entry.topic}
                                title={`${entry.title} (${counts[entry.topic]})`}
                                description={entry.description}
                                emoji={entry.emoji}
                                link={`/t/${entry.topic}`}
                            />
                        ))}
                    </div>
                    <h2
                        style={{
                            ...theme.typography.h2,
                            color: theme.colors.textPrimary,
                            marginTop: theme.spacing.xxl,
                        }}
                    >
                        最新文章
                    </h2>
                    <PostList posts={latest(10)} />
                </>
            ) : (
                <>
                    <h2
                        style={{
                            ...theme.typography.h2,
                            color: theme.colors.textPrimary,
                            marginTop: theme.spacing.xl,
                        }}
                    >
                        搜尋結果（{results.length}）
                    </h2>
                    <PostList posts={results} />
                </>
            )}
        </Section>
    );
};

export default Home;
