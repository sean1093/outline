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
            <div
                style={{
                    flex: 1,
                    paddingTop: theme.spacing.xxl,
                    paddingBottom: theme.spacing.xl,
                    maxWidth: '100%',
                    width: '100%',
                    margin: '0 auto',
                    paddingLeft: theme.spacing.lg,
                    paddingRight: theme.spacing.lg,
                    [`@media (min-width: ${theme.breakpoints.mobile})`]: {
                        maxWidth: '90%',
                    },
                    [`@media (min-width: ${theme.breakpoints.tablet})`]: {
                        maxWidth: '1200px',
                    },
                }}
            >
                {children}
            </div>
            <Footer />
        </div>
    );
};

export default Section;
