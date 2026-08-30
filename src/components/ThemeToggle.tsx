import React, { useEffect, useState } from 'react';
import {
    resolveMode,
    THEME_STORAGE_KEY,
    type ThemeMode,
} from '../lib/themeMode.ts';
import { theme } from '../styles/theme';

const NEXT: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'light' };

/** The word names what the button does, rather than a sun or a moon whose
 *  direction the visitor has to infer. */
const LABEL: Record<ThemeMode, string> = { light: '深色', dark: '淺色' };

const ThemeToggle: React.FC = () => {
    const [mode, setMode] = useState<ThemeMode>('light');

    // Read after mount rather than during render: the inline script in
    // index.html has already applied the attribute, so the first paint is
    // correct without this, and reading `matchMedia` during render would make
    // the render depend on it.
    useEffect(() => {
        let stored: string | null = null;
        try {
            stored = localStorage.getItem(THEME_STORAGE_KEY);
        } catch {
            // Safari in private mode throws on access rather than returning null.
        }
        setMode(
            resolveMode(
                stored,
                matchMedia('(prefers-color-scheme: dark)').matches
            )
        );
    }, []);

    return (
        <button
            type="button"
            onClick={() => {
                const next = NEXT[mode];
                document.documentElement.dataset.theme = next;
                try {
                    localStorage.setItem(THEME_STORAGE_KEY, next);
                } catch {
                    // A visitor who blocks storage still gets the toggle for
                    // the rest of this visit.
                }
                setMode(next);
            }}
            aria-label={`切換至${LABEL[mode]}模式`}
            style={{
                minWidth: '44px',
                minHeight: '40px',
                padding: `0 ${theme.spacing.sm}`,
                background: 'transparent',
                color: theme.colors.textPrimary,
                border: `1px solid ${theme.colors.borderControl}`,
                borderRadius: theme.radius,
                ...theme.typography.small,
                flexShrink: 0,
            }}
        >
            {LABEL[mode]}
        </button>
    );
};

export default ThemeToggle;
