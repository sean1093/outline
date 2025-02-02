import React from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import Flex from '../components/Flex';

const Outline: React.FC = () => {
    return (
        <Section>
            <Flex direction="column" justify="center" align="center" gap={20}>
                <Flex justify="space-around" gap={20}>
                    <Card
                        title="Travel"
                        description="探索各種旅行筆記與大綱"
                        emoji="🌍"
                        link="/travel"
                    />
                    <Card
                        title="Tech Learning"
                        description="整理技術文章與開發筆記"
                        emoji="💻"
                        link="/tech"
                    />
                    <Card
                        title="Algorithm"
                        description="學習演算法與資料結構"
                        emoji="💡"
                        link="/algorithm"
                    />
                </Flex>
            </Flex>
        </Section>
    );
};

export default Outline;
