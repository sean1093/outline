import React from 'react';

type SectionProps = {
    children: React.ReactNode;
};

type ListProps = {
    children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ children }) => {
    return (
        <div
            style={{
                width: '100vw',
                paddingTop: '70px',
            }}
        >
            {children}
        </div>
    );
};

export const ListContainer: React.FC<ListProps> = ({ children }) => {
    return (
        <div
            style={{
                paddingLeft: '18px',
            }}
        >
            {children}
        </div>
    );
};

export default Section;
