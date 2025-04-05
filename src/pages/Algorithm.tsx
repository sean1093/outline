import { useState } from 'react';
import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import SubMenu from '../components/SubMenu';
import { mediumDomain } from '../config/common';
import { blogPosts, leetCodePosts } from '../config/algoConfig';

type DisplayType = 'notes' | 'leetcode';

const Algorithm = () => {
    const [display, setDisplay] = useState<DisplayType>('notes');

    const menuItems = [
        { label: '演算法筆記', value: 'notes', icon: '📝' },
        { label: 'LeetCode 解題紀錄', value: 'leetcode', icon: '💻' }
    ];

    return (
        <Section>
            <SubMenu 
                items={menuItems}
                activeItem={display}
                onItemClick={(value) => setDisplay(value as DisplayType)}
            />
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
