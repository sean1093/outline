import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Flex from '../components/Flex';

const Outline: React.FC = () => {
    const recentPosts = [
        {
            title: '日本關西自由行攻略',
            date: '2024-02-15',
            category: '旅行',
            excerpt: '分享關西地區的必訪景點、美食推薦和交通攻略...',
            link: '/travel/japan-kansai'
        },
        {
            title: 'React Hooks 進階應用',
            date: '2024-02-10',
            category: '技術',
            excerpt: '深入探討 React Hooks 的進階使用技巧和最佳實踐...',
            link: '/tech/react-hooks'
        },
        {
            title: '動態規劃入門',
            date: '2024-02-05',
            category: '演算法',
            excerpt: '從基礎概念到實際應用，帶你認識動態規劃...',
            link: '/algorithm/dp-intro'
        }
    ];

    return (
        <Section>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* 個人簡介區塊 */}
                <Flex direction="column" align="center" gap={20} style={{ marginBottom: '40px' }}>
                    <div style={{ 
                        width: '150px', 
                        height: '150px', 
                        borderRadius: '50%', 
                        backgroundColor: '#333',
                        marginBottom: '20px'
                    }} />
                    <h1 style={{ fontSize: '2.5rem', margin: '0' }}>Sean's Notes</h1>
                    <p style={{ 
                        fontSize: '1.1rem', 
                        color: '#666', 
                        textAlign: 'center',
                        maxWidth: '600px'
                    }}>
                        這裡記錄了我的旅行見聞、技術學習心得和演算法筆記。
                        歡迎一起討論與學習 :)
                    </p>
                </Flex>

                {/* 最新文章區塊 */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>最新文章</h2>
                    <Flex direction="column" gap={20}>
                        {recentPosts.map((post, index) => (
                            <Card
                                key={index}
                                title={post.title}
                                description={post.excerpt}
                                emoji={post.category === '旅行' ? '🌍' : post.category === '技術' ? '💻' : '💡'}
                                link={post.link}
                                style={{
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                        ))}
                    </Flex>
                </div>

                {/* 分類文章區塊 */}
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>文章分類</h2>
                    <Flex justify="space-around" gap={20} style={{ flexWrap: 'wrap' }}>
                        <Card
                            title="旅行紀錄"
                            description="探索世界各地的旅行筆記"
                            emoji="🌍"
                            link="/travel"
                            style={{
                                width: '300px',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Card
                            title="技術筆記"
                            description="整理技術文章與開發筆記"
                            emoji="💻"
                            link="/tech"
                            style={{
                                width: '300px',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Card
                            title="演算法"
                            description="學習演算法與資料結構"
                            emoji="💡"
                            link="/algorithm"
                            style={{
                                width: '300px',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                    </Flex>
                </div>
            </div>
        </Section>
    );
};

export default Outline;
