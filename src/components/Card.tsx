import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CardProps {
    title: string;
    description: string;
    emoji: string;
    link: string;
}

const Card: React.FC<CardProps> = ({ title, description, emoji, link }) => {
    const navigate = useNavigate();

    const cardStyle: React.CSSProperties = {
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer',
        textAlign: 'center',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '8px',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '1rem',
        color: '#555',
    };

    return (
        <div
            style={cardStyle}
            onClick={() => navigate(link)}
            onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.05)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            <h2 style={titleStyle}>
                {emoji} {title}
            </h2>
            <p style={textStyle}>{description}</p>
        </div>
    );
};

export default Card;
