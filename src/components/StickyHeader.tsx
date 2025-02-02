import React from 'react';
import { useNavigate } from 'react-router-dom';

const StickyHeader: React.FC = () => {
    const navigate = useNavigate();

    const headerStyle: React.CSSProperties = {
        position: 'sticky',
        top: '0',
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#242424',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        borderBottom: '1px solid gray',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        cursor: 'pointer',
        fontWeight: 'bold',
    };

    const navStyle: React.CSSProperties = {
        display: 'flex',
        gap: '20px',
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
                    Travel
                </span>
                <span style={linkStyle} onClick={() => navigate('/tech')}>
                    Tech
                </span>
                <span style={linkStyle} onClick={() => navigate('/algorithm')}>
                    Algorithm
                </span>
            </nav>
        </header>
    );
};

export default StickyHeader;
