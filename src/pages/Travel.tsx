import { useState } from 'react';
import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import SubMenu from '../components/SubMenu';

import { bloggerDomain } from '../config/common';
import {
    hotelPostsTw,
    hotelPostsJp,
    travelPosts,
    barPosts,
} from '../config/travelConfig';

type DisplayType = 'hotelTw' | 'hotelJp' | 'travel' | 'bar';

const Travel = () => {
    const [display, setDisplay] = useState<DisplayType>('hotelTw');
    const posts: Record<
        DisplayType,
        | typeof hotelPostsTw
        | typeof hotelPostsJp
        | typeof travelPosts
        | typeof barPosts
    > = {
        hotelTw: hotelPostsTw,
        hotelJp: hotelPostsJp,
        travel: travelPosts,
        bar: barPosts,
    };

    const menuItems = [
        { label: '台灣住宿', value: 'hotelTw', icon: '🏨' },
        { label: '日本住宿', value: 'hotelJp', icon: '🏯' },
        { label: '旅遊景點', value: 'travel', icon: '🌍' },
        { label: '酒吧清單', value: 'bar', icon: '🍸' }
    ];

    return (
        <Section>
            <SubMenu 
                items={menuItems}
                activeItem={display}
                onItemClick={(value) => setDisplay(value as DisplayType)}
            />
            <ListContainer>
                <List domain={bloggerDomain} blogPosts={posts[display]} />
            </ListContainer>
        </Section>
    );
};

export default Travel;
