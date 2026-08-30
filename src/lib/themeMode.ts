export type ThemeMode = 'light' | 'dark';

/**
 * Shared with the inline script in `index.html`, which reads the same key
 * before first paint so the page never renders in the wrong palette. Change
 * one and you must change the other; `tests/theme-mode.test.ts` asserts they
 * agree.
 */
export const THEME_STORAGE_KEY = 'outline-theme';

/**
 * Three states collapse into two controls: an explicit choice wins, and
 * absent one we follow the system. Absent means no `data-theme` attribute at
 * all, which is what the `prefers-color-scheme` block in index.css keys on —
 * so "follow the system" keeps working when the system preference changes,
 * without the app listening for it.
 *
 * This module stays free of DOM references on purpose: `tests/` is compiled
 * by `tsconfig.scripts.json`, whose `lib` has no DOM, so the browser glue
 * lives in `ThemeToggle.tsx` instead.
 */
export function resolveMode(
    stored: string | null,
    prefersDark: boolean
): ThemeMode {
    if (stored === 'light' || stored === 'dark') return stored;
    return prefersDark ? 'dark' : 'light';
}
