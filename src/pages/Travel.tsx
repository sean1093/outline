import { useState } from 'react';
import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import Flex from '../components/Flex';

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
    return (
        <Section>
            <Flex style={{ padding: '18px', height: '50px' }}>
                <button onClick={() => setDisplay('hotelTw')}>台灣住宿</button>
                <button onClick={() => setDisplay('hotelJp')}>日本住宿</button>
                <button onClick={() => setDisplay('travel')}>旅遊景點</button>
                <button onClick={() => setDisplay('bar')}>酒吧清單</button>
            </Flex>
            <hr />
            <ListContainer>
                <List domain={bloggerDomain} blogPosts={posts[display]} />
            </ListContainer>
        </Section>
    );
};

export default Travel;
