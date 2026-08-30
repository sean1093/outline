import React from 'react';
import Footer from './Footer';
import { SectionProps } from '../types/common';
import { theme } from '../styles/theme';

const Section: React.FC<SectionProps> = ({ children, className, style }) => {
    return (
        <div
            className={`container ${className || ''}`}
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                paddingBottom: theme.spacing.xxl,
                paddingTop: '80px',
                ...style,
            }}
        >
            <div className="page">{children}</div>
            <Footer />
        </div>
    );
};

export default Section;
