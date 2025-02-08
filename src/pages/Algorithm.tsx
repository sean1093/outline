import { useState } from 'react';
import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import Flex from '../components/Flex';
import { mediumDomain } from '../config/common';
import { blogPosts, leetCodePosts } from '../config/algoConfig';

type DisplayType = 'notes' | 'leetcode';

const Algorithm = () => {
    const [display, setDisplay] = useState<DisplayType>('notes');
    return (
        <Section>
            <Flex style={{ padding: '18px', height: '50px' }}>
                <button onClick={() => setDisplay('notes')}>演算法筆記</button>
                <button onClick={() => setDisplay('leetcode')}>
                    LeetCode 解題紀錄
                </button>
            </Flex>
            <hr />
            <ListContainer>
                <List
                    domain={mediumDomain}
                    blogPosts={display === 'notes' ? blogPosts : leetCodePosts}
                />
            </ListContainer>
        </Section>
    );
};

export default Algorithm;
