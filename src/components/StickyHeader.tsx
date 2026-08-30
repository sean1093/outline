import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { theme } from '../styles/theme';

const NAV_ITEMS = [
    { to: '/', label: 'Home' },
    { to: '/t/travel', label: 'Travel' },
    { to: '/t/tech', label: 'Tech' },
    { to: '/t/algo', label: 'Algorithm' },
];

const StickyHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Escape closed nothing before, which is the one keyboard expectation an
    // overlay menu has to meet.
    useEffect(() => {
        if (!isMenuOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsMenuOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isMenuOpen]);

    const headerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: theme.colors.background,
        borderBottom: `1px solid ${theme.colors.hairline}`,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.md,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '0.9375rem',
        fontWeight: '500',
        letterSpacing: '0.06em',
        color: theme.colors.textPrimary,
    };

    const linkStyle: React.CSSProperties = {
        ...theme.typography.small,
        color: theme.colors.textSecondary,
        padding: `${theme.spacing.sm} 0`,
        letterSpacing: '0.04em',
    };

    const activeLinkStyle: React.CSSProperties = {
        ...linkStyle,
        color: theme.colors.textPrimary,
        textDecoration: 'underline',
        textDecorationThickness: '1px',
        textUnderlineOffset: '5px',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: theme.spacing.lg,
        alignItems: 'center',
    };

    const mobileNavStyle: React.CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        gap: 0,
        padding: `0 ${theme.spacing.md}`,
        background: theme.colors.background,
        borderBottom: `1px solid ${theme.colors.hairline}`,
        animation: 'slideDown 0.15s ease',
    };

    const menuButtonStyle: React.CSSProperties = {
        minWidth: '44px',
        minHeight: '40px',
        background: 'transparent',
        color: theme.colors.textPrimary,
        border: `1px solid ${theme.colors.borderControl}`,
        borderRadius: theme.radius,
        ...theme.typography.small,
    };

    const renderNav = (style: React.CSSProperties, className?: string) => (
        <nav style={style} className={className} aria-label="主要導覽">
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    style={
                        location.pathname === item.to
                            ? activeLinkStyle
                            : linkStyle
                    }
                    aria-current={
                        location.pathname === item.to ? 'page' : undefined
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
                Sean 的文章索引
            </Link>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                }}
            >
                {isMobile ? (
                    <>
                        <ThemeToggle />
                        <button
                            type="button"
                            style={menuButtonStyle}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? '關閉選單' : '開啟選單'}
                            aria-expanded={isMenuOpen}
                        >
                            選單
                        </button>
                        {renderNav(mobileNavStyle, 'nav-mobile')}
                    </>
                ) : (
                    <>
                        {renderNav(navStyle)}
                        <ThemeToggle />
                    </>
                )}
            </div>
        </header>
    );
};

export default StickyHeader;
