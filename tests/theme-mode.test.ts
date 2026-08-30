import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveMode, THEME_STORAGE_KEY } from '../src/lib/themeMode.ts';

describe('resolveMode', () => {
    it('honours an explicit choice over the system preference', () => {
        expect(resolveMode('light', true)).toBe('light');
        expect(resolveMode('dark', false)).toBe('dark');
    });

    it('follows the system when nothing is stored', () => {
        expect(resolveMode(null, true)).toBe('dark');
        expect(resolveMode(null, false)).toBe('light');
    });

    it('ignores a stored value it does not recognise', () => {
        // A stale or hand-edited key must not leave the site unstyled.
        for (const junk of ['', 'DARK', 'auto', 'true', '{}']) {
            expect(resolveMode(junk, false)).toBe('light');
            expect(resolveMode(junk, true)).toBe('dark');
        }
    });

    it('uses the same storage key as the pre-paint script in index.html', () => {
        // The two must agree or the page flashes the wrong palette on load.
        const html = readFileSync('index.html', 'utf8');
        expect(html).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
        expect(html).toContain('document.documentElement.dataset.theme');
    });
});
