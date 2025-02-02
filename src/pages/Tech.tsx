import Section from '../components/Section';
import List from '../components/List';
import { mediumDomain } from '../config/common';
import { blogPosts } from '../config/techConfig';

const Tech = () => {
    return (
        <Section>
            <List domain={mediumDomain} blogPosts={blogPosts} />
        </Section>
    );
};

export default Tech;
