import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import { mediumDomain } from '../config/common';
import { blogPosts } from '../config/techConfig';

const Tech = () => {
    return (
        <Section>
            <ListContainer>
                <List domain={mediumDomain} blogPosts={blogPosts} />
            </ListContainer>
        </Section>
    );
};

export default Tech;
