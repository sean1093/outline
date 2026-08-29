import React from 'react';
import SubMenu from './SubMenu';
import type { FacetValue } from '../lib/posts.ts';

interface FacetRowProps {
    allLabel: string;
    facets: FacetValue[];
    active: string | null;
    onSelect: (value: string | null) => void;
}

const FacetRow: React.FC<FacetRowProps> = ({
    allLabel,
    facets,
    active,
    onSelect,
}) => (
    <SubMenu
        items={[
            { label: allLabel, value: '' },
            ...facets.map((facet) => ({
                label: `${facet.value} (${facet.count})`,
                value: facet.value,
            })),
        ]}
        activeItem={active ?? ''}
        onItemClick={(value) => onSelect(value === '' ? null : value)}
    />
);

export default FacetRow;
