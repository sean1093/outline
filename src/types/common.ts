export interface BaseProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface SectionProps extends BaseProps {
    children: React.ReactNode;
}
