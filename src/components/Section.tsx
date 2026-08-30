import React from 'react';
import Footer from './Footer';
import type { SectionProps } from '../types/common';

/**
 * The page shell. `main` exists so the skip link has somewhere to land and so
 * assistive technology can jump past the header, which is six tab stops on
 * every route.
 */
const Section: React.FC<SectionProps> = ({ children, className, style }) => (
    <div
        className={`container ${className || ''}`}
        style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '56px',
            ...style,
        }}
    >
        {/* `tabIndex={-1}` so the skip link moves focus here rather than only
            relocating the sequential-focus starting point. */}
        <main id="content" className="page" tabIndex={-1}>
            {children}
        </main>
        <Footer />
    </div>
);

export default Section;
