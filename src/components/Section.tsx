import React from 'react';

type SectionProps = {
    children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ children }) => {
    return (
        <div style={{ width: '100vw', height: 'calc(100vh - 69px)', padding: '0 16px' }}>
            {children}
        </div>
    );
};

export default Section;
