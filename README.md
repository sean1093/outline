# Sean's Notes

A single index for articles published across several platforms. Posts are
pulled from their feeds, classified into three topics — tech, algo, travel —
and served as a small client-rendered React app.

Live at <https://sean1093.github.io/outline>.

## ✨ Features

- 📝 One index across Medium and Blogger, grouped by topic
- 🔎 Search over titles, tags and summaries; faceted browsing per topic
- 🔗 Shareable URLs — every filter lives in the query string
- 🎨 Responsive design — the header collapses to a menu on phone widths

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

`src/styles/theme.ts` holds colors, typography, spacing and breakpoints;
`src/index.css` holds the CSS variables, base element styles, responsive
breakpoints and keyframes. Components read tokens from the theme rather than
hardcoding values. The palette is light-only — there is no
`prefers-color-scheme` rule anywhere.

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an Issue.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
