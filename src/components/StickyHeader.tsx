import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { theme } from '../styles/theme';

const StickyHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
            if (!newIsMobile) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const headerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.sm,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: theme.spacing.md,
        alignItems: 'center',
    };

    const linkStyle: React.CSSProperties = {
        color: theme.colors.textPrimary,
        textDecoration: 'none',
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderRadius: '4px',
        transition: 'background-color 0.2s',
    };

    const activeLinkStyle: React.CSSProperties = {
        ...linkStyle,
        backgroundColor: theme.colors.primary,
        color: 'white',
    };

    const mobileNavStyle: React.CSSProperties = {
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.sm,
    };

    const menuButtonStyle: React.CSSProperties = {
        display: isMobile ? 'block' : 'none',
        background: 'none',
        border: 'none',
        color: theme.colors.textPrimary,
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: theme.spacing.xs,
    };

    return (
        <header style={headerStyle}>
            <Link to="/" style={titleStyle}>
                <span>📚</span> Sean's Notes
            </Link>
            {isMobile ? (
                <>
                    <button
                        style={menuButtonStyle}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                    <nav style={mobileNavStyle}>
                        <Link
                            to="/"
                            style={location.pathname === '/' ? activeLinkStyle : linkStyle}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/travel"
                            style={location.pathname === '/travel' ? activeLinkStyle : linkStyle}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Travel
                        </Link>
                        <Link
                            to="/algorithm"
                            style={location.pathname === '/algorithm' ? activeLinkStyle : linkStyle}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Algorithm
                        </Link>
                    </nav>
                </>
            ) : (
                <nav style={navStyle}>
                    <Link
                        to="/"
                        style={location.pathname === '/' ? activeLinkStyle : linkStyle}
                    >
                        Home
                    </Link>
                    <Link
                        to="/travel"
                        style={location.pathname === '/travel' ? activeLinkStyle : linkStyle}
                    >
                        Travel
                    </Link>
                    <Link
                        to="/algorithm"
                        style={location.pathname === '/algorithm' ? activeLinkStyle : linkStyle}
                    >
                        Algorithm
                    </Link>
                </nav>
            )}
        </header>
    );
};

export default StickyHeader;
