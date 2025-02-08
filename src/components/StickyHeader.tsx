import React from 'react';
import { useNavigate } from 'react-router-dom';

const StickyHeader: React.FC = () => {
    const navigate = useNavigate();

    const headerStyle: React.CSSProperties = {
        position: 'fixed',
        width: '100%',
        top: '0',
        backgroundColor: '#242424',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid gray',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        cursor: 'pointer',
        fontWeight: 'bold',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: '30px',
        paddingRight: '40px',
    };

    const linkStyle: React.CSSProperties = {
        fontSize: '1rem',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'color 0.2s ease-in-out',
    };

    return (
        <header style={headerStyle}>
            <div style={titleStyle} onClick={() => navigate('/')}>
                Sean's Notes
            </div>
            <nav style={navStyle}>
                <span style={linkStyle} onClick={() => navigate('/travel')}>
                    旅行紀錄
                </span>
                <span style={linkStyle} onClick={() => navigate('/tech')}>
                    技術筆記
                </span>
                <span style={linkStyle} onClick={() => navigate('/algorithm')}>
                    演算法相關
                </span>
            </nav>
        </header>
    );
};

export default StickyHeader;
