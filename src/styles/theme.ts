/**
 * Tokens for the inline styles that remain. The palette itself lives in
 * `src/index.css`, where media queries and the `data-theme` attribute can
 * reach it; these are only names for the same variables.
 *
 * `textFaint` is deliberately absent from the text roles: it fails 4.5:1 in
 * light mode and exists for hairlines and disabled glyphs.
 */
export const theme = {
    colors: {
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        hairline: 'var(--hairline)',
        borderControl: 'var(--border-control)',
        surface: 'var(--surface)',
        background: 'var(--bg)',
        accent: 'var(--accent)',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '40px',
    },
    radius: '2px',
    breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px',
    },
    typography: {
        h1: {
            fontSize: '1.75rem',
            fontWeight: '500',
            letterSpacing: '0.02em',
            lineHeight: '1.4',
        },
        h2: {
            fontSize: '1.125rem',
            fontWeight: '500',
            letterSpacing: '0.02em',
        },
        h3: {
            fontSize: '1rem',
            fontWeight: '500',
        },
        body: {
            fontSize: '1rem',
            lineHeight: '1.75',
        },
        small: {
            fontSize: '0.8125rem',
            lineHeight: '1.6',
        },
    },
};
