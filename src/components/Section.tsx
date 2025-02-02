import React from 'react';

type SectionProps = {
    children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ children }) => {
    return (
        <div style={{ width: '100vw', height: '100vh', paddingTop: '64px' }}>
            {children}
        </div>
    );
};

export default Section;
