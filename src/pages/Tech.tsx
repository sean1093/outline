import Section, { ListContainer } from '../components/Section';
import List from '../components/List';
import { mediumDomain } from '../config/common';
import { blogPosts } from '../config/techConfig';

const Tech = () => {
    return (
        <ListContainer>
            <Section>
                <List domain={mediumDomain} blogPosts={blogPosts} />
            </Section>
        </ListContainer>
    );
};

export default Tech;
