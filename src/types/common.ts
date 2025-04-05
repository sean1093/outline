export interface BaseProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface SectionProps extends BaseProps {
    children: React.ReactNode;
}

export interface ListProps extends BaseProps {
    children: React.ReactNode;
}

export interface CardProps extends BaseProps {
    title: string;
    description: string;
    emoji: string;
    link: string;
}

export interface MenuItem {
    title: string;
    path: string;
    emoji: string;
} 