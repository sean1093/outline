import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CardProps {
    title: string;
    description: string;
    link: string;
}

/**
 * A block on a hairline, not a floating card: no shadow, no lift on hover, no
 * decorative glyph. Styling lives in `index.css` because the grid that holds
 * these needs to set their padding, which an inline style would override.
 */
const Card: React.FC<CardProps> = ({ title, description, link }) => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            className="topic-card"
            onClick={() => navigate(link)}
        >
            <span className="topic-card-title">{title}</span>
            <span className="topic-card-desc">{description}</span>
        </button>
    );
};

export default Card;
