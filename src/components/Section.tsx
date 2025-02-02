import React from 'react';

type SectionProps = {
    children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ children }) => {
    return (
        <div style={{ width: '100vw', padding: '0 16px 16px 16px' }}>
            {children}
        </div>
    );
};

export default Section;
