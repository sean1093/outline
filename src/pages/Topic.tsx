import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import Section from '../components/Section';
import FacetRow from '../components/FacetRow';
import PostList from '../components/PostList';
import type { Topic as TopicName } from '../types/post.ts';
import { COUNTRIES } from '../lib/classify.ts';
import {
    countryFacets,
    countryOfPlace,
    filterPosts,
    placeFacets,
    tagFacets,
    typeFacets,
} from '../lib/posts.ts';
import { theme } from '../styles/theme';

const TITLES: Record<TopicName, string> = {
    tech: 'Tech',
    algo: 'Algorithm',
    travel: 'Travel',
};

const isTopic = (value: string | undefined): value is TopicName =>
    value === 'tech' || value === 'algo' || value === 'travel';

const Topic = () => {
    const { topic } = useParams<{ topic: string }>();
    const [params, setParams] = useSearchParams();

    if (!isTopic(topic)) return <Navigate to="/" replace />;

    const place = params.get('place');
    const type = params.get('type');
    const tag = params.get('tag');
    const lang = params.get('lang') === 'en' ? ('en' as const) : undefined;

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(params);
        if (value === null) next.delete(key);
        else next.set(key, value);
        setParams(next);
    };

    const activeCountry =
        place === null
            ? null
            : COUNTRIES.includes(place)
              ? place
              : (countryOfPlace(place) ?? null);
    const activePlace =
        place !== null && !COUNTRIES.includes(place) ? place : null;

    const results = filterPosts(
        topic === 'travel'
            ? {
                  topic,
                  ...(place === null ? {} : { place }),
                  ...(type === null ? {} : { type }),
                  ...(lang === undefined ? {} : { lang }),
              }
            : { topic, ...(tag === null ? {} : { tag }) }
    );

    return (
        <Section>
            <h1
                style={{
                    ...theme.typography.h1,
                    color: theme.colors.textPrimary,
                }}
            >
                {TITLES[topic]}
            </h1>

            {topic === 'travel' ? (
                <>
                    <FacetRow
                        allLabel="全部地區"
                        facets={countryFacets()}
                        active={activeCountry}
                        onSelect={(value) => setParam('place', value)}
                    />
                    {activeCountry !== null && (
                        <FacetRow
                            allLabel={`${activeCountry} 全部`}
                            facets={placeFacets(activeCountry)}
                            active={activePlace}
                            onSelect={(value) =>
                                setParam('place', value ?? activeCountry)
                            }
                        />
                    )}
                    <FacetRow
                        allLabel="全部類型"
                        facets={typeFacets()}
                        active={type}
                        onSelect={(value) => setParam('type', value)}
                    />
                </>
            ) : (
                <FacetRow
                    allLabel="全部標籤"
                    facets={tagFacets(topic)}
                    active={tag}
                    onSelect={(value) => setParam('tag', value)}
                />
            )}

            <p
                style={{
                    ...theme.typography.small,
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.md,
                }}
            >
                {results.length} 篇
                {topic === 'travel' && (
                    <button
                        onClick={() =>
                            setParam('lang', lang === 'en' ? null : 'en')
                        }
                        style={{
                            marginLeft: theme.spacing.md,
                            border: 'none',
                            background: 'none',
                            color: theme.colors.primary,
                            cursor: 'pointer',
                            ...theme.typography.small,
                        }}
                    >
                        {lang === 'en' ? '看中文版' : '看英文版 (4)'}
                    </button>
                )}
            </p>

            <PostList posts={results} />
        </Section>
    );
};

export default Topic;
