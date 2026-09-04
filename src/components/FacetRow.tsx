import React from 'react';
import SubMenu from './SubMenu';
import type { FacetValue } from '../lib/posts.ts';

interface FacetRowProps {
    allLabel: string;
    /** Names what the row filters, for the `role="group"` in `SubMenu`. */
    label: string;
    facets: FacetValue[];
    active: string | null;
    onSelect: (value: string | null) => void;
}

// A row with no facets offers only "all", which filters nothing — the English
// half of the travel index carries no place labels and would otherwise render
// a dead chip row above every list.
const FacetRow: React.FC<FacetRowProps> = ({
    allLabel,
    label,
    facets,
    active,
    onSelect,
}) =>
    facets.length === 0 ? null : (
        <SubMenu
            label={label}
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
