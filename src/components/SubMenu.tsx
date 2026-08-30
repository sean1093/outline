import React from 'react';

interface SubMenuProps {
    items: {
        label: string;
        value: string;
    }[];
    activeItem: string;
    onItemClick: (value: string) => void;
    /**
     * What this row filters. Without it a screen reader announces a bare run
     * of toggle buttons — on the travel page that was up to forty of them
     * across three rows with nothing saying which was region and which type.
     */
    label: string;
}

const SubMenu: React.FC<SubMenuProps> = ({
    items,
    activeItem,
    onItemClick,
    label,
}) => (
    <div className="chip-row" role="group" aria-label={label}>
        {items.map((item) => (
            <button
                key={item.value}
                type="button"
                className="chip"
                aria-pressed={activeItem === item.value}
                onClick={() => onItemClick(item.value)}
            >
                {item.label}
            </button>
        ))}
    </div>
);

export default SubMenu;
