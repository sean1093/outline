import React from 'react';
import Footer from './Footer';
import { SectionProps, ListProps } from '../types/common';
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

const ListContainer: React.FC<ListProps> = ({ children, className, style }) => {
    return (
        <ul
            className={`fade-in ${className || ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.xl,
                marginTop: theme.spacing.xl,
                listStyle: 'none',
                padding: 0,
                margin: 0,
                ...style,
            }}
        >
            {React.Children.map(children, (child, index) => (
                <li 
                    key={index} 
                    style={{ 
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing.sm,
                    }}
                >
                    <h3
                        style={{
                            ...theme.typography.h3,
                            color: theme.colors.textPrimary,
                            margin: 0,
                        }}
                    >
                        {React.isValidElement(child) && child.props.title}
                    </h3>
                    {child}
                </li>
            ))}
        </ul>
    );
};

export { ListContainer };
export default Section;
