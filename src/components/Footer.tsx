import React from 'react';
import { theme } from '../styles/theme';

const Footer: React.FC = () => (
    <footer
        style={{
            width: '100%',
            maxWidth: '820px',
            margin: '0 auto',
            padding: `${theme.spacing.lg} ${theme.spacing.md}`,
            borderTop: `1px solid ${theme.colors.hairline}`,
            ...theme.typography.small,
            color: theme.colors.textSecondary,
        }}
    >
        © {new Date().getFullYear()} Sean 的文章索引
    </footer>
);

export default Footer;
