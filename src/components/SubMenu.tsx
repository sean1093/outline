import React from 'react';
import Flex from './Flex';

interface SubMenuProps {
    items: {
        label: string;
        value: string;
        icon?: string;
    }[];
    activeItem: string;
    onItemClick: (value: string) => void;
}

const SubMenu: React.FC<SubMenuProps> = ({
    items,
    activeItem,
    onItemClick,
}) => {
    return (
        <div
            style={{
                width: '100%',
                maxWidth: '100%',
                position: 'relative',
                marginBottom: '12px',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background:
                        'linear-gradient(to right, var(--border-light) 0%, transparent 9%, transparent 91%, var(--border-light) 100%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            />
            <Flex
                className="chip-row"
                justify="flex-start"
                style={{
                    padding: '8px 0',
                    backgroundColor: 'var(--border-light)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    position: 'relative',
                    zIndex: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '0 16px',
                        minWidth: 'min-content',
                    }}
                >
                    {items.map((item) => (
                        <button
                            key={item.value}
                            aria-pressed={activeItem === item.value}
                            onClick={() => onItemClick(item.value)}
                            style={{
                                padding: '10px 14px',
                                border: 'none',
                                borderRadius: '20px',
                                backgroundColor:
                                    activeItem === item.value
                                        ? 'var(--primary-color)'
                                        : 'transparent',
                                color:
                                    activeItem === item.value
                                        ? 'white'
                                        : 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.9rem',
                                fontWeight:
                                    activeItem === item.value ? '600' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    activeItem === item.value
                                        ? 'var(--primary-hover)'
                                        : 'var(--surface-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    activeItem === item.value
                                        ? 'var(--primary-color)'
                                        : 'transparent';
                            }}
                        >
                            {item.icon && <span>{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            </Flex>
        </div>
    );
};

export default SubMenu;
