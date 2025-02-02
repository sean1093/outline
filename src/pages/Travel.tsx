import { useState } from 'react';
import Section from '../components/Section';
import List from '../components/List';
import Flex from '../components/Flex';

import { bloggerDomain } from '../config/common';
import { hotelPosts, travelPosts, barPosts } from '../config/travelConfig';

type DisplayType = 'hotel' | 'travel' | 'bar';

const Travel = () => {
    const [display, setDisplay] = useState<DisplayType>('hotel');
    const posts: Record<
        DisplayType,
        typeof hotelPosts | typeof travelPosts | typeof barPosts
    > = {
        hotel: hotelPosts,
        travel: travelPosts,
        bar: barPosts,
    };
    return (
        <Section>
            <Flex style={{ padding: '18px', height: '50px' }}>
                <button onClick={() => setDisplay('hotel')}>台灣住宿</button>
                <button onClick={() => setDisplay('travel')}>旅遊景點</button>
                <button onClick={() => setDisplay('bar')}>酒吧清單</button>
            </Flex>
            <hr />

            <List domain={bloggerDomain} blogPosts={posts[display]} />
        </Section>
    );
};

export default Travel;
