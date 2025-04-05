import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StickyHeader: React.FC = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const headerStyle: React.CSSProperties = {
        position: 'fixed',
        width: '100%',
        top: '0',
        backgroundColor: 'var(--surface-color)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 1000,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: '24px',
        paddingRight: '40px',
    };

    const mobileNavStyle: React.CSSProperties = {
        display: isMenuOpen ? 'flex' : 'none',
        flexDirection: 'column',
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: 'var(--surface-color)',
        padding: '16px',
        width: '240px',
        borderLeft: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1001,
        borderRadius: '0 0 0 12px',
    };

    const linkStyle: React.CSSProperties = {
        fontSize: '1rem',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        padding: '8px 12px',
        borderRadius: '8px',
    };

    const linkHoverStyle: React.CSSProperties = {
        backgroundColor: 'var(--background-color)',
        color: 'var(--primary-color)',
    };

    const mobileLinkStyle: React.CSSProperties = {
        padding: '12px 16px',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        borderBottom: '1px solid var(--border-color)',
    };

    const menuButtonStyle: React.CSSProperties = {
        display: isMobile ? 'block' : 'none',
        background: 'none',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
    };

    const menuButtonHoverStyle: React.CSSProperties = {
        backgroundColor: 'var(--background-color)',
    };

    return (
        <header style={headerStyle}>
            <div style={titleStyle} onClick={() => navigate('/')}>
                <span>📝</span>
                Sean's Notes
            </div>
            {isMobile && (
                <button 
                    style={menuButtonStyle}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, menuButtonHoverStyle)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, menuButtonStyle)}
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            )}
            {!isMobile && (
                <nav style={navStyle}>
                    <span 
                        style={linkStyle}
                        onClick={() => navigate('/travel')}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, linkStyle)}
                    >
                        旅行紀錄
                    </span>
                    <span 
                        style={linkStyle}
                        onClick={() => navigate('/tech')}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, linkStyle)}
                    >
                        技術筆記
                    </span>
                    <span 
                        style={linkStyle}
                        onClick={() => navigate('/algorithm')}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, linkStyle)}
                    >
                        演算法
                    </span>
                </nav>
            )}
            {isMobile && isMenuOpen && (
                <nav style={mobileNavStyle}>
                    <span 
                        style={{...linkStyle, ...mobileLinkStyle}}
                        onClick={() => {
                            navigate('/travel');
                            setIsMenuOpen(false);
                        }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {...linkStyle, ...mobileLinkStyle})}
                    >
                        旅行紀錄
                    </span>
                    <span 
                        style={{...linkStyle, ...mobileLinkStyle}}
                        onClick={() => {
                            navigate('/tech');
                            setIsMenuOpen(false);
                        }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {...linkStyle, ...mobileLinkStyle})}
                    >
                        技術筆記
                    </span>
                    <span 
                        style={{...linkStyle, ...mobileLinkStyle}}
                        onClick={() => {
                            navigate('/algorithm');
                            setIsMenuOpen(false);
                        }}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, linkHoverStyle)}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, {...linkStyle, ...mobileLinkStyle})}
                    >
                        演算法
                    </span>
                </nav>
            )}
        </header>
    );
};

export default StickyHeader;
