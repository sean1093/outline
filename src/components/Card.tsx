import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CardProps {
    title: string;
    description: string;
    emoji: string;
    link: string;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ title, description, emoji, link, style }) => {
    const navigate = useNavigate();

    const cardStyle: React.CSSProperties = {
        background: 'var(--surface-color)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        ...style
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '0.95rem',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
    };

    return (
        <div
            style={cardStyle}
            onClick={() => navigate(link)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <h2 style={titleStyle}>
                <span>{emoji}</span>
                {title}
            </h2>
            <p style={textStyle}>{description}</p>
        </div>
    );
};

export default Card;
