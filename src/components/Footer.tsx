import React from 'react';
import { theme } from '../styles/theme';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerStyle: React.CSSProperties = {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        textAlign: 'center',
        borderTop: `1px solid ${theme.colors.border}`,
        color: theme.colors.textSecondary,
        ...theme.typography.small,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
    };

    return (
        <footer style={footerStyle}>
            © {currentYear} Sean's Notes. All rights reserved.
        </footer>
    );
};

export default Footer; 