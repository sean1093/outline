# Sean's Notes

A single index for articles published across several platforms. Posts are
pulled from their feeds, classified into three topics — tech, algo, travel —
and served as a small client-rendered React app.

Live at <https://sean1093.github.io/outline>.

## ✨ Features

- 📝 One index across Medium and Blogger, grouped by topic
- 🔎 Search over titles, tags and summaries; faceted browsing per topic
- 🔗 Shareable URLs — every filter lives in the query string
- 🌓 Dark and light mode — follows the system, remembers an explicit choice
- 📱 Mobile first — the layout is composed for a phone and adds back on wider screens

## 🛠 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/) (`BrowserRouter`, base `/outline`)
- **Styling**: inline style objects from `src/styles/theme.ts` over CSS variables in `src/index.css`
- **Tests**: [Vitest](https://vitest.dev/)
- **Deployment**: [GitHub Pages](https://pages.github.com/)

## 🔄 How the index is built

**`yarn sync` merges the feeds into `data/posts.json`; it does not regenerate
it.** The feeds are authoritative for a post's title, date, summary and image,
but the committed `posts.json` is authoritative for _which posts exist_ — and,
because tags are unioned rather than replaced, for tags too (see below). The
index accumulates, so deleting the file loses articles permanently.

```
Medium + Blogger feeds ──┐
                         │
data/posts.json ─────────┤   yarn sync (scripts/sync.ts)
  (the previous index)   ├──▶  fetch → normalize → classify
data/seed.medium.json ───┤     merge by post id, apply overrides, sort
  (frozen backfill)      │
data/overrides.json ─────┘
                                        │
                                        ▼
                              data/posts.json
                              (rewritten in place; the app reads this)
                                        │
                                        │  daily GitHub Action
                                        │  (.github/workflows/sync.yml)
                                        │  commits it only when it actually
                                        │  changed, then deploys
                                        ▼
                       gh-pages → https://sean1093.github.io/outline
```

- **Never delete `data/posts.json` to "regenerate from scratch".** `sync.ts`
  reads the file back as prior state (`scripts/sync.ts:29-32`), so a missing
  file hits the `[]` fallback and the next sync silently rebuilds a _smaller_
  index. Medium's RSS serves only the 10 newest posts, and
  `data/seed.medium.json` covers only the 71 that existed when it was frozen —
  every Medium post published after that freeze and older than the current
  10-item window exists nowhere but `posts.json`. That set grows with every new
  article.
- Merging is by post id: later sources win field by field, and tags are always
  unioned. So the feeds refresh metadata for the posts they still serve, while
  `posts.json` carries the ones they no longer do.
- **Tags only ever accumulate, so a source-side tag removal does not
  propagate.** `posts.json` is an input to its own merge and tags are unioned
  on every id collision (`scripts/lib/merge.ts`), so renaming or deleting a
  Blogger label leaves the old tag in the index forever — the post then shows
  under both the old and the new tag, and re-syncing never corrects it. The same
  applies to `addTags`: removing an override row does not remove the tags it
  added. Making tags non-monotone needs per-source tag provenance, which is a
  schema change and a separate piece of work. Until then the only repairs are to
  edit `data/posts.json` by hand, or to delete the affected records from it so
  the next `yarn sync` re-adds them from the feed.
- `yarn sync` is idempotent: unchanged sources produce a byte-identical file,
  which is what lets the daily job commit only real changes.
- The app imports `data/posts.json` at build time. There is no server and no
  runtime fetch, so a rebuild is what publishes new posts.
- `data/posts.json` is in `.prettierignore` on purpose. The generator writes
  expanded tag arrays that Prettier would collapse, and every sync would then
  produce a spurious whole-file diff. Never format it.
- `data/seed.medium.json` is a frozen one-off backfill of Medium posts that had
  already aged out of the RSS window when the index was first built. It is read
  on every sync, never rewritten.

### The one file you edit by hand

`data/overrides.json`. Keyed by post id, it corrects what the feed cannot tell
us:

```json
{
    "/2026/01/sapporo-hotel-review-royal-park-canvas.html": {
        "addTags": ["日本", "札幌"]
    }
}
```

- `addTags` — add country/place tags the post was published without. One-way:
  removing the row does not remove the tags (see the tag note above)
- `topic` — force `tech`, `algo` or `travel` when the classifier guesses wrong
- `hidden` — hide a post from the site. The record stays in `data/posts.json`,
  marked `"hidden": true`; `filterPosts` in `src/lib/posts.ts` drops it at read
  time, so it disappears from every list, search and facet count. Nothing is
  deleted, so this is reversible: remove the override, run `yarn sync`, and the
  post comes back

Edit it, run `yarn sync`, commit both files. Nothing else in `data/` is written
by hand — but nothing else in `data/` is disposable either, since `posts.json`
is the only record of the posts the feeds have stopped serving.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 24, enforced by `engines` in `package.json` (`scripts/` run
  TypeScript directly, no build step)
- yarn

### Installation

```bash
git clone https://github.com/sean1093/outline.git
cd outline
yarn install
```

### Development

```bash
yarn dev      # dev server
yarn test     # vitest
yarn lint     # eslint
yarn format   # prettier --write .
```

### Refresh the index

```bash
yarn sync     # fetch feeds, merge into data/posts.json (never replaces it)
```

Commit the result. See [How the index is built](#-how-the-index-is-built) for
why the file must not be deleted first.

### Build and deploy

```bash
yarn build    # tsc -b && vite build
yarn deploy   # predeploy copies dist/index.html to dist/404.html, then gh-pages
```

The `404.html` copy is the SPA fallback: GitHub Pages has no rewrite rules, so
without it a direct hit on `/outline/t/travel` would 404 instead of reaching
the router.

## 📁 Project Structure

```
data/               # the accumulated index (posts.json), medium seed, hand-written overrides
scripts/            # yarn sync and one-off backfill tools
├── lib/            # feed fetchers, normalizers, merge
src/
├── assets/         # static assets
├── components/     # PostList, FacetRow, Section, Card, StickyHeader, …
├── lib/            # classify (topic/travel-type/place rules), posts (selectors), url
├── pages/          # Home and Topic
├── styles/         # theme tokens
└── types/          # Post, Override, shared component props
tests/              # vitest: unit rules over fixtures, selectors over the real index
```

## 🎨 Design System

The surface is deliberately quiet: an unbleached paper ground (生成り) rather
than white, hairlines instead of shadows, 2px corners, and no decorative
glyph anywhere. There is no accent fill competing with the text — the accent
colour appears only in focus rings. Links inherit the text colour and earn an
underline on hover, because a blue link on a paper ground would break the
whole surface.

`src/styles/theme.ts` names the tokens the remaining inline styles need;
`src/index.css` owns the palette, base element styles, responsive breakpoints
and keyframes. Components read tokens rather than hardcoding values, and
anything the CSS needs to control — the topic card's padding, the nav's tap
targets — lives in a class, since an inline style would win the specificity
fight.

Two palettes: the light one on `:root`, the dark one on
`:root[data-theme='dark']` plus a `prefers-color-scheme` block for visitors
who have expressed no preference in this app. The dark palette is warm
charcoal, not blue-black — the same paper seen at night. An inline script in
`index.html` applies the stored choice before first paint, so the page never
flashes the wrong palette; it reads the same storage key as
`src/lib/themeMode.ts`, and a test asserts the two agree. Every colour a
component uses is a variable — a hardcoded one shows up immediately as white
text on white in dark mode.

Three rules came out of measuring contrast rather than eyeballing it, and
each is invisible until someone cannot read the page:

- **`--text-faint` never carries text.** It scores 3.31:1 on the light
  ground. It is for hairlines and disabled glyphs. The post eyebrow used to
  use it and failed AA in both themes; it now uses `--text-secondary`
  (5.14:1 light, 6.86:1 dark).
- **The selected filter chip inverts** — ink on paper becomes paper on ink,
  13.09:1 light and 13.69:1 dark. An accent-filled chip scored 2.54:1 in dark
  mode, because lightening an accent so links stay legible is the wrong
  direction for white text sitting on it.
- **Interactive borders get their own token.** WCAG 1.4.11 wants 3:1 for a
  control boundary and the decorative `--hairline` is only 1.25:1, so
  `--border-control` exists at 3.31:1 light / 3.74:1 dark.

The CSS is mobile first: each rule states the phone case and a `min-width`
query adds back what a larger screen can afford. On a 390px viewport the
thumbnails are 72px rather than 112px, the topic-card descriptions are
hidden, and the article stream is ordered above the topic cards — measured
together, that moved the first article from 739px of an 844px viewport to
300px. Tap targets are 40px on the filter chips and 48px in the overlay nav.

Thumbnails ask the Blogger CDN for its `s320` size rather than `s640`. Both
render into a box that is at most 112px wide, and the smaller token cut a
mobile `/t/travel` view from 6,432KB across 58 images to 1,885KB across 46.

A skip link (`跳到主要內容`) precedes the header and lands on
`<main id="content" tabindex="-1">`. The `tabindex` is what makes focus
actually move rather than only relocating the sequential-focus starting
point, and `main:focus-visible { outline: none }` keeps that from drawing a
ring around the entire content column. Each filter row is a
`role="group"` with an `aria-label` naming what it filters, and Escape closes
the mobile menu.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an Issue.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
