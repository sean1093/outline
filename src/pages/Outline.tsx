import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Flex from '../components/Flex';

const Outline: React.FC = () => {
    return (
        <Section>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Hero 區塊 */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, #3b82f6 100%)',
                    borderRadius: '24px',
                    padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)',
                    marginBottom: 'clamp(40px, 8vw, 60px)',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* 背景裝飾 */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-30%',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        opacity: 0.3
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30%',
                        left: '-20%',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        opacity: 0.2
                    }} />
                    
                    <Flex direction="column" align="center" gap={24} style={{ position: 'relative', zIndex: 1 }}>
                        {/* 頭像區域 */}
                        <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            border: '4px solid rgba(255,255,255,0.2)'
                        }}>
                            👨‍💻
                        </div>
                        
                        <div>
                            <h1 style={{ 
                                fontSize: 'clamp(2rem, 5vw, 3rem)', 
                                margin: '0 0 16px 0',
                                fontWeight: '700',
                                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                Sean's Notes
                            </h1>
                            <p style={{ 
                                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
                                opacity: 0.9,
                                maxWidth: '600px',
                                lineHeight: '1.6',
                                margin: '0 auto'
                            }}>
                                探索世界 🌍 | 技術學習 💻 | 演算法筆記 💡
                            </p>
                            <p style={{ 
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)', 
                                opacity: 0.8,
                                marginTop: '16px',
                                maxWidth: '500px',
                                margin: '16px auto 0'
                            }}>
                                分享旅行見聞與技術心得，一起學習成長
                            </p>
                        </div>
                    </Flex>
                </div>

                {/* 分類文章區塊 */}
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h2 style={{ 
                            fontSize: '2.25rem', 
                            marginBottom: '12px',
                            color: 'var(--text-primary)',
                            fontWeight: '600'
                        }}>
                            文章分類
                        </h2>
                        <p style={{ 
                            fontSize: '1.1rem', 
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            選擇你感興趣的主題，開始探索吧！
                        </p>
                    </div>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '24px',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        <Card
                            title="旅行紀錄"
                            description="探索世界各地的精彩旅程，分享住宿體驗與景點推薦"
                            emoji="🌍"
                            link="/travel"
                            style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #e0f2fe'
                            }}
                        />
                        <Card
                            title="技術筆記"
                            description="前端開發、雲端服務與程式設計的學習心得"
                            emoji="💻"
                            link="/tech"
                            style={{
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                border: '1px solid #dcfce7'
                            }}
                        />
                        <Card
                            title="演算法"
                            description="資料結構與演算法的學習筆記與解題思路"
                            emoji="💡"
                            link="/algorithm"
                            style={{
                                background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                                border: '1px solid #fef3c7'
                            }}
                        />
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default Outline;
