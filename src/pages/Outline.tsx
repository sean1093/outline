import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Flex from '../components/Flex';

const Outline: React.FC = () => {
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
