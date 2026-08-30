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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow:
            '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        transition: 'all 0.3s ease',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--primary-color), #3b82f6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        transition: 'all 0.3s ease',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: theme.spacing.md,
        alignItems: 'center',
    };

    const linkStyle: React.CSSProperties = {
        color: theme.colors.textPrimary,
        textDecoration: 'none',
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        borderRadius: '8px',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
    };

    const activeLinkStyle: React.CSSProperties = {
        ...linkStyle,
        background: 'linear-gradient(135deg, var(--primary-color), #3b82f6)',
        color: 'white',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
    };

    const mobileNavStyle: React.CSSProperties = {
        position: 'fixed',
        top: '72px',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: theme.spacing.lg,
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.border}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        animation: isMenuOpen ? 'slideDown 0.3s ease' : 'slideUp 0.3s ease',
    };

    const menuButtonStyle: React.CSSProperties = {
        display: isMobile ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        color: theme.colors.textPrimary,
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: theme.spacing.sm,
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        width: '44px',
        height: '44px',
    };

    const NAV_ITEMS = [
        { to: '/', label: 'Home' },
        { to: '/t/travel', label: 'Travel' },
        { to: '/t/tech', label: 'Tech' },
        { to: '/t/algo', label: 'Algorithm' },
    ];

    const renderNav = (style: React.CSSProperties) => (
        <nav style={style}>
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    style={
                        location.pathname === item.to
                            ? activeLinkStyle
                            : linkStyle
                    }
                    onClick={() => setIsMenuOpen(false)}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );

    return (
        <header style={headerStyle}>
            <Link to="/" style={titleStyle}>
                <span>📚</span> Sean 的文章索引
            </Link>
            {isMobile ? (
                <>
                    <button
                        style={menuButtonStyle}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                    {renderNav(mobileNavStyle)}
                </>
            ) : (
                renderNav(navStyle)
            )}
        </header>
    );
};

export default StickyHeader;
