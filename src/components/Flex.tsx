import React from 'react';

type FlexProps = {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justify?:
        | 'flex-start'
        | 'center'
        | 'flex-end'
        | 'space-between'
        | 'space-around';
    align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
    gap?: number;
    height?: string | number;
    width?: string | number;
    children: React.ReactNode;
};

const Flex: React.FC<FlexProps> = ({
    direction = 'row',
    justify = 'center',
    align = 'center',
    gap = 20,
    height = 'inherit',
    width = 'inherit',
    children,
}) => {
    const flexStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        height: height,
        width: width,
        gap: `${gap}px`,
    };

    return <div style={flexStyle}>{children}</div>;
};

export default Flex;
