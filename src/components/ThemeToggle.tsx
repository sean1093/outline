import React, { useEffect, useState } from 'react';
import {
    resolveMode,
    THEME_STORAGE_KEY,
    type ThemeMode,
} from '../lib/themeMode.ts';
import { theme } from '../styles/theme';

const NEXT: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'light' };
const LABEL: Record<ThemeMode, string> = {
    light: '切換至深色模式',
    dark: '切換至淺色模式',
};

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
            aria-label={LABEL[mode]}
            title={LABEL[mode]}
            style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '50%',
                background: 'transparent',
                color: theme.colors.textPrimary,
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1,
                flexShrink: 0,
            }}
        >
            <span aria-hidden="true">{mode === 'dark' ? '☀️' : '🌙'}</span>
        </button>
    );
};

export default ThemeToggle;
