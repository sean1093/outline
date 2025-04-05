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

const SubMenu: React.FC<SubMenuProps> = ({ items, activeItem, onItemClick }) => {
    return (
        <div style={{ 
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            marginBottom: '12px'
        }}>
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, #f8f9fa 0%, transparent 5%, transparent 95%, #f8f9fa 100%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />
            <Flex 
                style={{ 
                    padding: '8px 0',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    position: 'relative',
                    zIndex: 0
                }}
            >
                <div style={{ 
                    display: 'flex',
                    gap: '8px',
                    padding: '0 16px',
                    minWidth: 'min-content'
                }}>
                    {items.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => onItemClick(item.value)}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '20px',
                                backgroundColor: activeItem === item.value ? '#007bff' : 'transparent',
                                color: activeItem === item.value ? 'white' : '#333',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.9rem',
                                fontWeight: activeItem === item.value ? '600' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = activeItem === item.value ? '#0056b3' : '#e9ecef';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = activeItem === item.value ? '#007bff' : 'transparent';
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