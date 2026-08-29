# Outline 自動化文章索引站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `outline` 從手工維護的連結清單改成由 Medium／Blogger feed 驅動、每日自動更新的文章索引站。

**Architecture:** 一支 Node 腳本抓兩個 feed，正規化成單一 `Post` 形狀，以 `id` 為鍵做 append-only 合併，輸出 `data/posts.json` 並 commit 進 repo；前端只讀這份 JSON，頁面收斂成 Home 與 Topic 兩頁，過濾狀態全部存在 URL query。分類規則是純函式，由固定的 fixture 迴歸測試守住。

**Tech Stack:** Vite 6 + React 18 + TypeScript 5.6 + react-router-dom 7 + vitest + fast-xml-parser；Node 24（原生執行 `.ts`，不需要 tsx）；yarn 1；GitHub Actions 排程 + gh-pages 部署。

**Spec:** `docs/superpowers/specs/2026-08-29-outline-portal-design.md`

## Global Constraints

- 程式風格照 `.prettierrc`：4 空格縮排、單引號、`semi: true`、`trailingComma: "es5"`。每次 commit 前跑 `yarn format`。
- **Node 執行的 `.ts` 檔，import 必須帶 `.ts` 副檔名**（Node 型別剝離不做路徑解析），型別匯入一律 `import type`。`tsconfig` 已開 `allowImportingTsExtensions`。
- **不得使用 enum、namespace、parameter properties**：Node 的型別剝離不支援，會直接執行失敗。
- 新增依賴只有這三個，全部是 devDependency：`vitest`、`fast-xml-parser`、`@types/node`。不要引入 tsx、ts-node、axios、lodash、搜尋 library、CSS-in-JS library。
- 樣式一律用 `src/styles/theme.ts` 與 `src/index.css` 既有的 CSS 變數，不引入新樣式方案。
- 外連網址一律經過 `withUtm()`，不得用字串拼接 query。
- `data/posts.json` 是生成物但**必須 commit**；`merge` 永遠 append-only，不得刪除既有 id。
- 實測常數（驗收要對得上）：Blogger 全站 134 篇、地名 label 39 個、Medium RSS 上限 10 篇、Medium 歷史 seed 71 篇（`travelConfig` 以外的 72 筆條目去重後為 71）、travel 類型驗證集 55 筆。
- 每個 task 結束都 commit，訊息用 Conventional Commits。不要在 task 中途跑 `yarn build` 或整包 lint 以外的重活。

---

## File Structure

| 檔案 | 責任 |
| --- | --- |
| `src/types/post.ts` | `Post`／`Source`／`Topic`／`Override` 型別，唯一的資料契約 |
| `src/lib/classify.ts` | 純分類函式：`deriveTopic`、`classifyTravelType`、`splitPlaces`、常數 `COUNTRIES`／`TRAVEL_TYPES` |
| `src/lib/url.ts` | `withUtm()` |
| `src/lib/posts.ts` | 前端選取器：載入 JSON、`filterPosts`、`latest`、`countsByTopic`、各種 facet |
| `scripts/lib/blogger.ts` | Blogger feed 抓取與正規化，含縮圖升級、摘要、geo |
| `scripts/lib/medium.ts` | Medium RSS 抓取與正規化 |
| `scripts/lib/merge.ts` | `mergePosts`、`comparePosts` |
| `scripts/sync.ts` | orchestration：抓 → 合併 → 寫檔 |
| `scripts/backfill-medium.ts` | 一次性：產生 `data/seed.medium.json` |
| `src/pages/Home.tsx` | 最新文章 + 三個 topic 入口 + 搜尋 |
| `src/pages/Topic.tsx` | 單一 topic 清單 + facet 過濾（狀態在 URL） |
| `src/components/PostList.tsx` | 文章列表呈現 |
| `src/components/FacetRow.tsx` | 一列 facet chips，包一層 `SubMenu` |
| `tests/*.test.ts` | 純函式測試 |
| `tests/fixtures/*` | 真實 feed 快照與 55 筆人工分類答案 |
| `.github/workflows/sync.yml` | 每日排程、commit、部署 |

---

### Task 1: 工具鏈、fixtures 與人工分類答案

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.app.json`
- Modify: `tsconfig.json`
- Create: `tsconfig.scripts.json`
- Modify: `eslint.config.js`
- Create: `tests/fixtures/blogger.json`（下載）
- Create: `tests/fixtures/medium.xml`（下載）
- Create: `tests/fixtures/travel-type.json`（從 `src/config/travelConfig.ts` 抽出）
- Create: `tests/fixtures.test.ts`

**Interfaces:**
- Consumes: 無
- Produces: `yarn test` 可執行；`tests/fixtures/travel-type.json` 為 `Record<string, '住宿' | '景點' | '酒吧'>`，共 55 筆，key 是 Blogger 文章路徑（如 `/2022/12/regent-taipei.html`）

**這個 task 必須排第一**：`tests/fixtures/travel-type.json` 只能從 `src/config/travelConfig.ts` 抽出，而那個檔案會在 Task 12 被刪除。順序反了就永遠拿不到驗證集。

- [ ] **Step 1: 安裝依賴**

```bash
yarn add -D vitest fast-xml-parser @types/node
```

- [ ] **Step 2: 加入 npm scripts**

在 `package.json` 的 `scripts` 中加入三個項目（保留既有項目不動）：

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc -b && vite build",
        "lint": "eslint .",
        "preview": "vite preview",
        "test": "vitest run",
        "sync": "node scripts/sync.ts",
        "predeploy": "yarn build && cp dist/index.html dist/404.html",
        "deploy": "gh-pages -d dist",
        "format": "prettier --write ."
    }
}
```

`predeploy` 多出的 `cp` 是 gh-pages 的 SPA fallback：GitHub Pages 對未知路徑回 `404.html`，內容給它同一份 SPA shell，`/outline/t/travel` 這種深連結就能直接開。

- [ ] **Step 3: 讓 TS 認得 JSON import**

在 `tsconfig.app.json` 的 `compilerOptions` 中加入一行：

```json
        "resolveJsonModule": true,
```

- [ ] **Step 4: 建立 scripts/tests 的 tsconfig**

Create `tsconfig.scripts.json`:

```json
{
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.scripts.tsbuildinfo",
        "target": "ES2022",
        "lib": ["ES2023"],
        "module": "ESNext",
        "moduleResolution": "bundler",
        "types": ["node"],
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "moduleDetection": "force",
        "noEmit": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": ["scripts", "tests"]
}
```

在 `tsconfig.json` 的 `references` 陣列尾端加入：

```json
        { "path": "./tsconfig.scripts.json" }
```

- [ ] **Step 5: 讓 eslint 認得 Node 環境**

`eslint.config.js` 目前只給 `globals.browser`，`scripts/` 用到 `process` 會被 `no-undef` 擋。在 `tseslint.config(...)` 的參數尾端（最後一個物件之後）加入一個設定區塊：

```js
    {
        files: ['scripts/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            globals: globals.node,
        },
    }
```

- [ ] **Step 6: 下載真實 feed 快照**

```bash
mkdir -p tests/fixtures
curl -s 'https://travel-sean.blogspot.com/feeds/posts/default?alt=json&max-results=150&start-index=1' -o tests/fixtures/blogger.json
curl -s 'https://medium.com/feed/@sean1093' -o tests/fixtures/medium.xml
```

`max-results=150` **不會**一次回全部 134 篇——Task 1 實測發現 Blogger 把回應截在約 2.6MB，單次只回 74 筆。fixture 是 `start-index=1`（74 筆）與 `start-index=75`（60 筆）兩頁合併後的文件，`feed.entry` 換成兩頁串接的 134 筆，其餘欄位保留第一頁原樣。

- [ ] **Step 7: 從舊 config 抽出 55 筆人工分類答案**

```bash
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('src/config/travelConfig.ts', 'utf8');
const groups = src.split(/export const (\w+)\s*=/).slice(1);
const typeOf = { hotelPostsTw: '住宿', hotelPostsJp: '住宿', travelPosts: '景點', barPosts: '酒吧' };
const out = {};
for (let i = 0; i < groups.length; i += 2) {
    const type = typeOf[groups[i]];
    for (const m of groups[i + 1].matchAll(/link: '([^']+)'/g)) out[m[1]] = type;
}
writeFileSync('tests/fixtures/travel-type.json', JSON.stringify(out, null, 4) + '\n');
console.log('entries:', Object.keys(out).length);
"
```

Expected: `entries: 55`

- [ ] **Step 8: 寫 fixture 完整性測試**

Create `tests/fixtures.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import bloggerFeed from './fixtures/blogger.json';
import travelType from './fixtures/travel-type.json';

describe('fixtures', () => {
    it('blogger snapshot holds the whole blog', () => {
        expect(bloggerFeed.feed.entry).toHaveLength(134);
    });

    it('travel-type ground truth holds all 55 hand-labelled posts', () => {
        const entries = Object.entries(travelType as Record<string, string>);
        expect(entries).toHaveLength(55);
        expect(new Set(entries.map(([, type]) => type))).toEqual(
            new Set(['住宿', '景點', '酒吧'])
        );
    });

    it('every hand-labelled path exists in the feed', () => {
        const paths = new Set(
            bloggerFeed.feed.entry.map(
                (entry) =>
                    new URL(
                        entry.link.find((link) => link.rel === 'alternate')!.href
                    ).pathname
            )
        );
        const missing = Object.keys(travelType).filter((path) => !paths.has(path));
        expect(missing).toEqual([]);
    });
});
```

- [ ] **Step 9: 跑測試**

Run: `yarn test`
Expected: 3 passed。若 `blogger snapshot` 不是 134，表示這期間有新文章，把數字改成實際值並在 commit 訊息註明。

- [ ] **Step 10: Commit**

```bash
yarn format
git add package.json yarn.lock tsconfig.json tsconfig.app.json tsconfig.scripts.json eslint.config.js tests
git commit -m "test: add real feed fixtures and hand-labelled travel types"
```

---

### Task 2: Post 型別與 deriveTopic

**Files:**
- Create: `src/types/post.ts`
- Create: `src/lib/classify.ts`
- Create: `tests/topic.test.ts`

**Interfaces:**
- Consumes: 無
- Produces:
  - `Post`、`Source = 'medium' | 'blogger'`、`Topic = 'tech' | 'algo' | 'travel'`、`Override`、`Overrides`
  - `deriveTopic(source: Source, title: string, tags: string[]): Topic`

- [ ] **Step 1: 寫失敗的測試**

Create `tests/topic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveTopic } from '../src/lib/classify.ts';

describe('deriveTopic', () => {
    it('sends every blogger post to travel', () => {
        expect(deriveTopic('blogger', '札幌住宿 | 某飯店', ['日本'])).toBe('travel');
    });

    it('uses medium tags before the title', () => {
        expect(
            deriveTopic('medium', '演算法筆記系列 — QuadTree 與 GeoHash', [
                'algorithms',
                'geohash',
            ])
        ).toBe('algo');
        expect(deriveTopic('medium', '不帶線索的標題', ['leetcode'])).toBe('algo');
        expect(deriveTopic('medium', '不帶線索的標題', ['演算法'])).toBe('algo');
    });

    it('falls back to the title for seed posts that have no tags', () => {
        expect(deriveTopic('medium', '[LeetCode 解題紀錄] 139. Word Break', [])).toBe(
            'algo'
        );
        expect(deriveTopic('medium', '基礎演算法系列 — Sort', [])).toBe('algo');
    });

    it('treats everything else on medium as tech', () => {
        expect(
            deriveTopic('medium', 'AI 學習筆記 — LLM 底層原理淺談', ['llm', 'ai'])
        ).toBe('tech');
        expect(deriveTopic('medium', '什麼是 SLI、SLO與 SLA 呢？', [])).toBe('tech');
    });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/topic.test.ts`
Expected: FAIL — 找不到模組 `../src/lib/classify.ts`

- [ ] **Step 3: 寫型別**

Create `src/types/post.ts`:

```ts
export type Source = 'medium' | 'blogger';

export type Topic = 'tech' | 'algo' | 'travel';

export interface Post {
    id: string;
    source: Source;
    title: string;
    url: string;
    topic: Topic;
    tags: string[];
    date?: string;
    summary?: string;
    image?: string;
    geo?: [number, number];
    lang?: 'en';
}

export interface Override {
    topic?: Topic;
    addTags?: string[];
    hidden?: true;
}

export type Overrides = Record<string, Override>;
```

- [ ] **Step 4: 寫最小實作**

Create `src/lib/classify.ts`:

```ts
import type { Source, Topic } from '../types/post.ts';

const ALGO_TAGS = ['algorithms', 'leetcode', '演算法'];
const ALGO_TITLE = /\[LeetCode 解題紀錄\]|演算法筆記|基礎演算法/;

export function deriveTopic(source: Source, title: string, tags: string[]): Topic {
    if (source === 'blogger') return 'travel';
    if (tags.some((tag) => ALGO_TAGS.includes(tag))) return 'algo';
    if (ALGO_TITLE.test(title)) return 'algo';
    return 'tech';
}
```

- [ ] **Step 5: 跑測試確認通過**

Run: `yarn test tests/topic.test.ts`
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
yarn format
git add src/types/post.ts src/lib/classify.ts tests/topic.test.ts
git commit -m "feat: add post schema and topic derivation"
```

---

### Task 3: classifyTravelType（55/55 迴歸）

**Files:**
- Modify: `src/lib/classify.ts`
- Create: `tests/travel-type.test.ts`

**Interfaces:**
- Consumes: `deriveTopic` 所在的 `src/lib/classify.ts`
- Produces:
  - `TRAVEL_TYPES: string[]`（`['住宿', '酒吧', '景點', '美食', '交通', '行程']`）
  - `classifyTravelType(title: string, labels: string[]): string | undefined`

規則設計依據（spec §7.4，全部有實測數字）：只掃標題以 `|` 切開後的**前兩段**。掃全標題會把 `台南住宿 | … | 飯店 bar` 誤判成酒吧；只掃第一段會漏掉 `關西自由行 | 大阪住宿 | …` 這 10 篇。pattern 的**順序是演算法的一部分**，由特定到一般，`行程` 收尾。

- [ ] **Step 1: 寫失敗的測試**

Create `tests/travel-type.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyTravelType } from '../src/lib/classify.ts';
import bloggerFeed from './fixtures/blogger.json';
import travelType from './fixtures/travel-type.json';

interface FeedEntry {
    title: { $t: string };
    category?: { term: string }[];
    link: { rel: string; href: string }[];
}

const entries = bloggerFeed.feed.entry as FeedEntry[];
const truth = travelType as Record<string, string>;

const pathOf = (entry: FeedEntry) =>
    new URL(entry.link.find((link) => link.rel === 'alternate')!.href).pathname;

const labelsOf = (entry: FeedEntry) =>
    (entry.category ?? []).map((category) => category.term);

describe('classifyTravelType', () => {
    it('reproduces all 55 hand-labelled posts with zero mistakes', () => {
        const wrong: string[] = [];
        let checked = 0;
        for (const entry of entries) {
            const expected = truth[pathOf(entry)];
            if (expected === undefined) continue;
            checked += 1;
            const actual = classifyTravelType(entry.title.$t, labelsOf(entry));
            if (actual !== expected) {
                wrong.push(`${pathOf(entry)}: want ${expected}, got ${actual}`);
            }
        }
        expect(checked).toBe(55);
        expect(wrong).toEqual([]);
    });

    it('gives every post in the feed a type', () => {
        const uncovered = entries
            .filter(
                (entry) =>
                    classifyTravelType(entry.title.$t, labelsOf(entry)) === undefined
            )
            .map((entry) => entry.title.$t);
        expect(uncovered).toEqual([]);
    });

    it('prefers a source label over the title', () => {
        expect(classifyTravelType('台南住宿 | 某飯店', ['台南', '美食'])).toBe('美食');
    });

    it('ignores type words after the second segment', () => {
        expect(
            classifyTravelType('台南住宿 | 台南晶英酒店 | 客房介紹 | 飯店 bar', ['台南'])
        ).toBe('住宿');
    });

    it('finds the type in the second segment', () => {
        expect(
            classifyTravelType('關西自由行 | 大阪住宿 | 大阪東急卓越大酒店', [
                '大阪',
                '日本',
            ])
        ).toBe('住宿');
    });

    it('returns undefined when nothing matches', () => {
        expect(classifyTravelType('隨手筆記 | 沒有類型線索', ['台北'])).toBeUndefined();
    });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/travel-type.test.ts`
Expected: FAIL — `classifyTravelType is not a function`

- [ ] **Step 3: 寫實作**

在 `src/lib/classify.ts` 的 `import type` 之後、`ALGO_TAGS` 之前插入：

```ts
export const COUNTRIES = ['台灣', '日本', '泰國', '澳洲', '馬來西亞'];

export const LANG_LABEL = '英文版本';

const TRAVEL_TYPE_RULES: [string, RegExp][] = [
    ['住宿', /住宿|飯店|旅館|民宿|hotel|accommodation|hostel|ryokan|resort/i],
    ['酒吧', /酒吧|bar\b|居酒屋|cocktail|speakeasy/i],
    ['景點', /景點|attraction|park\b/i],
    ['美食', /美食|餐廳|咖啡|cafe|甜點|早餐|restaurant/i],
    ['交通', /航空|airlines|機場|鐵路|新幹線|租車|jr\b/i],
    ['行程', /自由行|自助旅行|旅遊|行程|懶人包|攻略|itinerary/i],
];

export const TRAVEL_TYPES = TRAVEL_TYPE_RULES.map(([type]) => type);

export function classifyTravelType(
    title: string,
    labels: string[]
): string | undefined {
    const fromLabel = labels.find((label) => TRAVEL_TYPES.includes(label));
    if (fromLabel !== undefined) return fromLabel;
    const head = title.split('|').slice(0, 2).join(' | ');
    return TRAVEL_TYPE_RULES.find(([, pattern]) => pattern.test(head))?.[0];
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `yarn test tests/travel-type.test.ts`
Expected: 6 passed。第一個測試若失敗，訊息會直接列出哪幾篇分錯——修 pattern，不要改測試。

- [ ] **Step 5: Commit**

```bash
yarn format
git add src/lib/classify.ts tests/travel-type.test.ts
git commit -m "feat: classify travel post types from title prefix"
```

---

### Task 4: 地點拆解 splitPlaces

**Files:**
- Modify: `src/lib/classify.ts`
- Create: `tests/places.test.ts`

**Interfaces:**
- Consumes: `COUNTRIES`、`TRAVEL_TYPES`、`LANG_LABEL`
- Produces: `splitPlaces(tags: string[]): { countries: string[]; places: string[] }`

- [ ] **Step 1: 寫失敗的測試**

Create `tests/places.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { splitPlaces } from '../src/lib/classify.ts';

describe('splitPlaces', () => {
    it('separates countries from places', () => {
        expect(splitPlaces(['北海道', '日本', '札幌'])).toEqual({
            countries: ['日本'],
            places: ['北海道', '札幌'],
        });
    });

    it('keeps country-only posts free of places', () => {
        expect(splitPlaces(['台灣'])).toEqual({ countries: ['台灣'], places: [] });
    });

    it('keeps every country of a cross-country post', () => {
        expect(
            splitPlaces(['台灣', '日本', '澳洲', '馬來西亞', '酒吧']).countries
        ).toEqual(['台灣', '日本', '澳洲', '馬來西亞']);
    });

    it('never counts a travel type as a place', () => {
        expect(splitPlaces(['台北', '台灣', '住宿']).places).toEqual(['台北']);
    });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/places.test.ts`
Expected: FAIL — `splitPlaces is not a function`

- [ ] **Step 3: 寫實作**

在 `src/lib/classify.ts` 檔尾加入：

```ts
export function splitPlaces(tags: string[]): {
    countries: string[];
    places: string[];
} {
    return {
        countries: tags.filter((tag) => COUNTRIES.includes(tag)),
        places: tags.filter(
            (tag) =>
                !COUNTRIES.includes(tag) &&
                !TRAVEL_TYPES.includes(tag) &&
                tag !== LANG_LABEL
        ),
    };
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `yarn test tests/places.test.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
yarn format
git add src/lib/classify.ts tests/places.test.ts
git commit -m "feat: split blogger labels into countries and places"
```

---

### Task 5: feed 正規化

**Files:**
- Create: `scripts/lib/blogger.ts`
- Create: `scripts/lib/medium.ts`
- Create: `tests/normalize.test.ts`

**Interfaces:**
- Consumes: `Post`（Task 2）、`classifyTravelType`／`LANG_LABEL`（Task 3）、`deriveTopic`（Task 2）
- Produces:
  - `scripts/lib/blogger.ts`：`BloggerEntry`、`normalizeBlogger(entry: BloggerEntry): Post`、`fetchBlogger(): Promise<BloggerEntry[]>`、`upgradeThumb(url: string): string`、`summarize(html: string, max?: number): string`
  - `scripts/lib/medium.ts`：`MediumItem`、`normalizeMedium(item: MediumItem): Post`、`fetchMedium(): Promise<MediumItem[]>`

實測依據：Blogger 的 `title.$t` 已是解碼過的純文字（134 篇中 0 個 HTML entity），不需要 unescape。縮圖 134/134 都含**恰好一個** `s72` 尺寸 token（三種形態：`=s72-w640-h512-c`、同樣式加 `?authuser=2`、路徑式 `/s72-w640-h512-c/`），把它換成 `s640` 四種形態實測都回 200，且檔案從 3–12KB 變成 106–140KB。`?authuser=` 對匿名請求無妨，不需要移除。

**`fetchBlogger` 的分頁迴圈是必要的，不要「簡化」成單次請求。** Task 1 實測：Blogger 會把回應主體截在約 2.6MB，`max-results=150` 與 `max-results=500` 回傳位元組相同的內容，都只有 **74** 筆，且 feed 不提供 `rel="next"`。實際分頁行為是 `start-index=1` → 74 筆、`start-index=75` → 60 筆、再往後 → 0 筆。迴圈以「該頁回 0 筆就結束」為終止條件，這對上述行為是正確的。另外 `feed.openSearch$itemsPerPage` 會回報 `500` 這種與實際筆數不符的值，**不可**用它推算數量。

- [ ] **Step 1: 寫失敗的測試**

Create `tests/normalize.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    normalizeBlogger,
    summarize,
    upgradeThumb,
    type BloggerEntry,
} from '../scripts/lib/blogger.ts';
import { normalizeMedium, type MediumItem } from '../scripts/lib/medium.ts';
import bloggerFeed from './fixtures/blogger.json';

const entries = bloggerFeed.feed.entry as unknown as BloggerEntry[];

describe('upgradeThumb', () => {
    it('upgrades the trailing size token', () => {
        expect(
            upgradeThumb('https://lh3.googleusercontent.com/pw/AAA=s72-w640-h512-c')
        ).toBe('https://lh3.googleusercontent.com/pw/AAA=s640-w640-h512-c');
    });

    it('upgrades a path-style size token', () => {
        expect(
            upgradeThumb('https://blogger.googleusercontent.com/img/x/s72-w640-h512-c/')
        ).toBe('https://blogger.googleusercontent.com/img/x/s640-w640-h512-c/');
    });

    it('rewrites exactly one token per url', () => {
        const upgraded = entries.map((entry) =>
            upgradeThumb(entry['media$thumbnail']!.url)
        );
        expect(upgraded.filter((url) => url.includes('s72'))).toEqual([]);
        expect(upgraded.filter((url) => url.includes('s640'))).toHaveLength(
            entries.length
        );
    });
});

describe('summarize', () => {
    it('strips markup and collapses whitespace', () => {
        expect(summarize('<div>  hello <b>world</b>\n</div>')).toBe('hello world');
    });

    it('truncates with an ellipsis', () => {
        expect(summarize('x'.repeat(200))).toHaveLength(141);
    });
});

describe('normalizeBlogger', () => {
    const post = normalizeBlogger(
        entries.find(
            (entry) =>
                entry.link.find((link) => link.rel === 'alternate')!.href ===
                'https://travel-sean.blogspot.com/2022/12/regent-taipei.html'
        )!
    );

    it('uses the article path as id and keeps the absolute url', () => {
        expect(post.id).toBe('/2022/12/regent-taipei.html');
        expect(post.url).toBe(
            'https://travel-sean.blogspot.com/2022/12/regent-taipei.html'
        );
    });

    it('always lands in travel and carries a derived type tag', () => {
        expect(post.topic).toBe('travel');
        expect(post.tags).toContain('住宿');
        expect(post.tags).toContain('台北');
    });

    it('normalizes the date to UTC iso', () => {
        expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('never emits the language label as a tag', () => {
        const english = entries.filter((entry) =>
            (entry.category ?? []).some((category) => category.term === '英文版本')
        );
        expect(english).toHaveLength(4);
        for (const entry of english) {
            const normalized = normalizeBlogger(entry);
            expect(normalized.lang).toBe('en');
            expect(normalized.tags).not.toContain('英文版本');
        }
    });

    it('normalizes every entry in the feed', () => {
        const posts = entries.map(normalizeBlogger);
        expect(posts).toHaveLength(134);
        expect(posts.filter((post) => post.date === undefined)).toEqual([]);
        expect(posts.filter((post) => post.image === undefined)).toEqual([]);
        expect(new Set(posts.map((post) => post.id)).size).toBe(134);
    });

    it('reads the geo point when present', () => {
        const withGeo = entries.map(normalizeBlogger).filter((post) => post.geo);
        expect(withGeo.length).toBeGreaterThan(120);
        for (const post of withGeo.slice(0, 5)) {
            expect(post.geo).toHaveLength(2);
            expect(Number.isFinite(post.geo![0])).toBe(true);
        }
    });
});

describe('normalizeMedium', () => {
    const item: MediumItem = {
        title: '[LeetCode 解題紀錄] 139. Word Break',
        guid: 'https://medium.com/p/ad188926d9ef',
        pubDate: 'Wed, 04 Mar 2026 12:00:00 GMT',
        category: ['leetcode', 'dynamic-programming'],
        'content:encoded':
            '<figure><img src="https://miro.medium.com/v2/1*abc.png" /></figure><p>解題思路</p>',
    };

    it('derives id and canonical url from guid', () => {
        const post = normalizeMedium(item);
        expect(post.id).toBe('p/ad188926d9ef');
        expect(post.url).toBe('https://medium.com/p/ad188926d9ef');
    });

    it('carries tags, topic, date and first image', () => {
        const post = normalizeMedium(item);
        expect(post.topic).toBe('algo');
        expect(post.tags).toEqual(['leetcode', 'dynamic-programming']);
        expect(post.date).toBe('2026-03-04T12:00:00.000Z');
        expect(post.image).toBe('https://miro.medium.com/v2/1*abc.png');
        expect(post.summary).toBe('解題思路');
    });

    it('accepts a single category as a string', () => {
        const post = normalizeMedium({ ...item, category: 'leetcode' });
        expect(post.tags).toEqual(['leetcode']);
    });

    it('parses the real rss snapshot', async () => {
        const { parseMediumXml } = await import('../scripts/lib/medium.ts');
        const items = parseMediumXml(
            readFileSync('tests/fixtures/medium.xml', 'utf8')
        );
        expect(items).toHaveLength(10);
        const posts = items.map(normalizeMedium);
        expect(posts.every((post) => post.id.startsWith('p/'))).toBe(true);
        expect(posts.filter((post) => post.date === undefined)).toEqual([]);
        expect(posts.filter((post) => post.topic === 'algo').length).toBeGreaterThan(0);
    });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/normalize.test.ts`
Expected: FAIL — 找不到 `../scripts/lib/blogger.ts`

- [ ] **Step 3: 實作 Blogger 正規化**

Create `scripts/lib/blogger.ts`:

```ts
import type { Post } from '../../src/types/post.ts';
import {
    classifyTravelType,
    deriveTopic,
    LANG_LABEL,
} from '../../src/lib/classify.ts';

export const BLOGGER_FEED =
    'https://travel-sean.blogspot.com/feeds/posts/default';

export interface BloggerEntry {
    title: { $t: string };
    published: { $t: string };
    content?: { $t: string };
    category?: { term: string }[];
    link: { rel: string; href: string }[];
    'media$thumbnail'?: { url: string };
    'georss$point'?: { $t: string };
}

export function upgradeThumb(url: string): string {
    return url.replace(/([=/])s72\b/, '$1s640');
}

export function summarize(html: string, max = 140): string {
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function parseGeo(entry: BloggerEntry): [number, number] | undefined {
    const raw = entry['georss$point']?.$t;
    if (raw === undefined) return undefined;
    const [lat, lng] = raw.split(' ').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
    return [lat, lng];
}

export function normalizeBlogger(entry: BloggerEntry): Post {
    const url = entry.link.find((link) => link.rel === 'alternate')!.href;
    const labels = (entry.category ?? []).map((category) => category.term);
    const type = classifyTravelType(entry.title.$t, labels);
    const tags = [
        ...labels.filter((label) => label !== LANG_LABEL),
        ...(type === undefined ? [] : [type]),
    ];
    const thumbnail = entry['media$thumbnail']?.url;
    const geo = parseGeo(entry);
    return {
        id: new URL(url).pathname,
        source: 'blogger',
        title: entry.title.$t,
        url,
        topic: deriveTopic('blogger', entry.title.$t, tags),
        tags: [...new Set(tags)],
        date: new Date(entry.published.$t).toISOString(),
        ...(entry.content ? { summary: summarize(entry.content.$t) } : {}),
        ...(thumbnail ? { image: upgradeThumb(thumbnail) } : {}),
        ...(geo ? { geo } : {}),
        ...(labels.includes(LANG_LABEL) ? { lang: 'en' as const } : {}),
    };
}

export async function fetchBlogger(): Promise<BloggerEntry[]> {
    const all: BloggerEntry[] = [];
    let start = 1;
    for (;;) {
        const response = await fetch(
            `${BLOGGER_FEED}?alt=json&max-results=150&start-index=${start}`
        );
        if (!response.ok) {
            throw new Error(`blogger feed responded ${response.status}`);
        }
        const body = (await response.json()) as {
            feed: { entry?: BloggerEntry[] };
        };
        const entries = body.feed.entry ?? [];
        if (entries.length === 0) return all;
        all.push(...entries);
        start += entries.length;
    }
}
```

條件展開（`...(cond ? { x } : {})`）是刻意的：不要寫 `summary: undefined`，否則合併時 spread 會用 undefined 蓋掉既有值。

- [ ] **Step 4: 實作 Medium 正規化**

Create `scripts/lib/medium.ts`:

```ts
import { XMLParser } from 'fast-xml-parser';
import type { Post } from '../../src/types/post.ts';
import { deriveTopic } from '../../src/lib/classify.ts';
import { summarize } from './blogger.ts';

export const MEDIUM_FEED = 'https://medium.com/feed/@sean1093';

export interface MediumItem {
    title: string;
    guid: string;
    pubDate: string;
    category?: string | string[];
    'content:encoded'?: string;
}

export function parseMediumXml(xml: string): MediumItem[] {
    const parsed = new XMLParser({ ignoreAttributes: true }).parse(xml) as {
        rss?: { channel?: { item?: MediumItem | MediumItem[] } };
    };
    const item = parsed.rss?.channel?.item;
    if (item === undefined) return [];
    return Array.isArray(item) ? item : [item];
}

export function normalizeMedium(item: MediumItem): Post {
    const id = `p/${item.guid.split('/').pop()!}`;
    const tags =
        item.category === undefined
            ? []
            : Array.isArray(item.category)
              ? item.category
              : [item.category];
    const html = item['content:encoded'] ?? '';
    const image = html.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const summary = html === '' ? undefined : summarize(html);
    return {
        id,
        source: 'medium',
        title: item.title,
        url: `https://medium.com/${id}`,
        topic: deriveTopic('medium', item.title, tags),
        tags,
        date: new Date(item.pubDate).toISOString(),
        ...(summary ? { summary } : {}),
        ...(image ? { image } : {}),
    };
}

export async function fetchMedium(): Promise<MediumItem[]> {
    const response = await fetch(MEDIUM_FEED);
    if (!response.ok) {
        throw new Error(`medium feed responded ${response.status}`);
    }
    return parseMediumXml(await response.text());
}
```

- [ ] **Step 5: 跑測試確認通過**

Run: `yarn test tests/normalize.test.ts`
Expected: 全部 passed。`summarize` 的圖片測試若因 `<figure>` 殘留空白而失敗，檢查 strip 後的 `replace(/\s+/g, ' ').trim()` 是否生效。

- [ ] **Step 6: Commit**

```bash
yarn format
git add scripts/lib/blogger.ts scripts/lib/medium.ts tests/normalize.test.ts
git commit -m "feat: normalize blogger and medium feeds into posts"
```

---

### Task 6: append-only 合併

**Files:**
- Create: `scripts/lib/merge.ts`
- Create: `tests/merge.test.ts`

**Interfaces:**
- Consumes: `Post`、`Overrides`
- Produces: `mergePosts(existing: Post[], incoming: Post[], overrides?: Overrides): Post[]`、`comparePosts(a: Post, b: Post): number`

- [ ] **Step 1: 寫失敗的測試**

Create `tests/merge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Post } from '../src/types/post.ts';
import { mergePosts } from '../scripts/lib/merge.ts';

const post = (over: Partial<Post> & Pick<Post, 'id'>): Post => ({
    source: 'medium',
    title: `title ${over.id}`,
    url: `https://medium.com/${over.id}`,
    topic: 'tech',
    tags: [],
    ...over,
});

describe('mergePosts', () => {
    it('keeps posts the feed no longer returns', () => {
        const merged = mergePosts(
            [post({ id: 'p/old', date: '2020-01-01T00:00:00.000Z' })],
            [post({ id: 'p/new', date: '2026-01-01T00:00:00.000Z' })]
        );
        expect(merged.map((entry) => entry.id)).toEqual(['p/new', 'p/old']);
    });

    it('lets the feed refresh fields but unions tags', () => {
        const merged = mergePosts(
            [post({ id: 'p/x', title: 'old title', tags: ['seeded'] })],
            [post({ id: 'p/x', title: 'new title', tags: ['leetcode'] })]
        );
        expect(merged).toHaveLength(1);
        expect(merged[0].title).toBe('new title');
        expect(merged[0].tags).toEqual(['seeded', 'leetcode']);
    });

    it('never lets an absent field erase a present one', () => {
        const merged = mergePosts(
            [post({ id: 'p/x', date: '2021-06-21T12:57:43.476Z' })],
            [post({ id: 'p/x' })]
        );
        expect(merged[0].date).toBe('2021-06-21T12:57:43.476Z');
    });

    it('dedupes a post that appears twice in one batch', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'p/5bc7be208eac', tags: ['two-pointers'] }),
                post({ id: 'p/5bc7be208eac', tags: ['greedy'] }),
            ]
        );
        expect(merged).toHaveLength(1);
        expect(merged[0].tags).toEqual(['two-pointers', 'greedy']);
    });

    it('applies overrides', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'a', tags: ['英文版本-less'] }),
                post({ id: 'b' }),
                post({ id: 'c' }),
            ],
            {
                a: { addTags: ['台灣', '台北'] },
                b: { topic: 'travel' },
                c: { hidden: true },
            }
        );
        expect(merged.map((entry) => entry.id)).toEqual(['a', 'b']);
        expect(merged[0].tags).toEqual(['英文版本-less', '台灣', '台北']);
        expect(merged[1].topic).toBe('travel');
    });

    it('sorts dated posts first, newest first, undated by title', () => {
        const merged = mergePosts(
            [],
            [
                post({ id: 'z', title: 'zzz' }),
                post({ id: 'a', title: 'aaa' }),
                post({ id: 'old', date: '2020-01-01T00:00:00.000Z' }),
                post({ id: 'new', date: '2026-01-01T00:00:00.000Z' }),
            ]
        );
        expect(merged.map((entry) => entry.id)).toEqual(['new', 'old', 'a', 'z']);
    });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/merge.test.ts`
Expected: FAIL — 找不到 `../scripts/lib/merge.ts`

- [ ] **Step 3: 寫實作**

Create `scripts/lib/merge.ts`:

```ts
import type { Overrides, Post } from '../../src/types/post.ts';

export function comparePosts(a: Post, b: Post): number {
    if (a.date !== undefined && b.date !== undefined) {
        return b.date.localeCompare(a.date);
    }
    if (a.date !== undefined) return -1;
    if (b.date !== undefined) return 1;
    return a.title.localeCompare(b.title);
}

export function mergePosts(
    existing: Post[],
    incoming: Post[],
    overrides: Overrides = {}
): Post[] {
    const byId = new Map<string, Post>();
    for (const post of [...existing, ...incoming]) {
        const previous = byId.get(post.id);
        byId.set(
            post.id,
            previous === undefined
                ? { ...post }
                : {
                      ...previous,
                      ...post,
                      tags: [...new Set([...previous.tags, ...post.tags])],
                  }
        );
    }

    const merged: Post[] = [];
    for (const post of byId.values()) {
        const override = overrides[post.id];
        if (override?.hidden === true) continue;
        if (override?.topic !== undefined) post.topic = override.topic;
        if (override?.addTags !== undefined) {
            post.tags = [...new Set([...post.tags, ...override.addTags])];
        }
        merged.push(post);
    }
    return merged.sort(comparePosts);
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `yarn test tests/merge.test.ts`
Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
yarn format
git add scripts/lib/merge.ts tests/merge.test.ts
git commit -m "feat: merge feed batches append-only with overrides"
```

---

### Task 7: sync 腳本與第一次真跑

**Files:**
- Create: `scripts/sync.ts`
- Create: `data/overrides.json`
- Create: `data/posts.json`（由腳本產生）

**Interfaces:**
- Consumes: `fetchBlogger`／`normalizeBlogger`、`fetchMedium`／`normalizeMedium`、`mergePosts`
- Produces: `data/posts.json`（`Post[]`，已排序）；`yarn sync` 可重複執行且結果穩定

- [ ] **Step 1: 建立 overrides 檔（先放 4 篇英文版的地點）**

Create `data/overrides.json`:

```json
{
    "/2025/06/royal-park-canvas-sapporo-odori-park-en.html": {
        "addTags": ["日本", "札幌"]
    }
}
```

這只是格式範例，**真正的 4 個 id 在 Step 4 用實際資料填**。

- [ ] **Step 2: 寫 sync 腳本**

Create `scripts/sync.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import type { Overrides, Post } from '../src/types/post.ts';
import { fetchBlogger, normalizeBlogger } from './lib/blogger.ts';
import { fetchMedium, normalizeMedium } from './lib/medium.ts';
import { mergePosts } from './lib/merge.ts';

const POSTS_PATH = 'data/posts.json';
const SEED_PATH = 'data/seed.medium.json';
const OVERRIDES_PATH = 'data/overrides.json';

function readJson<T>(path: string, fallback: T): T {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
        throw error;
    }
}

const [bloggerEntries, mediumItems] = await Promise.all([
    fetchBlogger(),
    fetchMedium(),
]);

const incoming = [
    ...bloggerEntries.map(normalizeBlogger),
    ...mediumItems.map(normalizeMedium),
];
const existing = [
    ...readJson<Post[]>(POSTS_PATH, []),
    ...readJson<Post[]>(SEED_PATH, []),
];
const overrides = readJson<Overrides>(OVERRIDES_PATH, {});
const merged = mergePosts(existing, incoming, overrides);

writeFileSync(POSTS_PATH, `${JSON.stringify(merged, null, 4)}\n`);

const counts = merged.reduce<Record<string, number>>((acc, post) => {
    acc[post.source] = (acc[post.source] ?? 0) + 1;
    acc[post.topic] = (acc[post.topic] ?? 0) + 1;
    return acc;
}, {});
console.log(`wrote ${merged.length} posts`, counts);
```

空 feed 的守衛**不在這裡**，在 `fetchBlogger`／`fetchMedium` 內部（Task 5 fix round 1 的裁決）：一條規則放兩個地方會漂移，而 fetcher 才是知道「這兩個來源的 feed 長什麼樣才算有效」的那一層。這裡不需要自己檢查——任一 fetcher throw，`Promise.all` 就 reject、腳本非零退出、什麼都不會寫，這正是 spec §10 要的「任一 feed 異常時保留上一版」。

- [ ] **Step 3: 第一次真跑**

```bash
mkdir -p data
yarn sync
```

Expected: `wrote 144 posts { blogger: 134, travel: 134, medium: 10, ... }`（Medium 只有 RSS 的 10 篇，seed 還沒做）

- [ ] **Step 4: 用真實資料填好 overrides 的 4 筆**

```bash
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const english = posts.filter((post) => post.lang === 'en');
console.log('english posts:', english.length);
const guess = { Sapporo: ['日本', '札幌'], Taipei: ['台灣', '台北'], Yilan: ['台灣', '宜蘭'], 'Sun Moon Lake': ['台灣', '日月潭'] };
const overrides = {};
for (const post of english) {
    const key = Object.keys(guess).find((name) => post.title.startsWith(name));
    if (!key) throw new Error('unmapped english post: ' + post.title);
    overrides[post.id] = { addTags: guess[key] };
    console.log(post.id, '->', guess[key].join('/'));
}
writeFileSync('data/overrides.json', JSON.stringify(overrides, null, 4) + '\n');
"
yarn sync
```

Expected: `english posts: 4`，四行對應輸出，然後 sync 再跑一次成功。

- [ ] **Step 5: 驗證輸出**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const blogger = posts.filter((post) => post.source === 'blogger');
console.log('total', posts.length);
console.log('blogger', blogger.length);
console.log('blogger without date', blogger.filter((post) => !post.date).length);
console.log('blogger without image', blogger.filter((post) => !post.image).length);
console.log('blogger without country', blogger.filter((post) => !post.tags.some((tag) => ['台灣','日本','泰國','澳洲','馬來西亞'].includes(tag))).length);
console.log('dupes', posts.length - new Set(posts.map((post) => post.id)).size);
"
```

Expected: `blogger 134`、三個 `without ...` 全為 `0`、`dupes 0`

- [ ] **Step 6: Commit**

```bash
yarn format
git add scripts/sync.ts data/posts.json data/overrides.json
git commit -m "feat: add feed sync script and generate posts.json"
```

---

### Task 8: Medium 歷史 backfill

**Files:**
- Create: `scripts/backfill-medium.ts`
- Create: `data/seed.medium.json`
- Modify: `data/posts.json`（重跑 sync）

**Interfaces:**
- Consumes: `src/config/techConfig.ts`、`src/config/algoConfig.ts`（僅此一次，之後刪除）
- Produces: `data/seed.medium.json`（`Post[]`，71 筆，含 `date`／`tags`／`summary`／`image`）

**機制已實測確認**（curl 對 Medium 一律 403，只能用真實瀏覽器）：

- headless Chrome 會撞上 Cloudflare 挑戰頁（`Attention Required!`），**必須 headful**。
- 本機已有 Chrome 在跑時直接啟動會搶不到 CDP，**必須指定獨立 `--user-data-dir`**。
- 在 `https://sean1093.medium.com` 這個 origin 內 `fetch('https://medium.com/p/<id>?format=json')` 可跨域成功（200，`application/json`）。
- 回應前面有防護前綴 `])}while(1);</x>`，必須先剝掉再 `JSON.parse`。
- 可用欄位：`payload.value.firstPublishedAt`（epoch ms）、`payload.value.virtuals.tags[].slug`、`payload.value.virtuals.subtitle`、`payload.value.virtuals.previewImage.imageId`。
- 圖片網址 `https://miro.medium.com/v2/resize:fit:640/<imageId>` 實測 200。
- **標題不覆寫**：既有 config 的標題是你手寫整理過的（例如 `基礎演算法系列 — Sort`，Medium 原標題是 `基礎演算法系列 — 你只會用 built-in function 來排序嗎？`），backfill 只補 `date`／`tags`／`summary`／`image`。

- [ ] **Step 1: 抽出 71 個 id 與標題**

```bash
node --input-type=module -e "
import { readFileSync, writeFileSync } from 'node:fs';
const src = ['src/config/techConfig.ts', 'src/config/algoConfig.ts'].map((path) => readFileSync(path, 'utf8')).join('\n');
const seen = new Map();
for (const match of src.matchAll(/title: '((?:[^'\\\\]|\\\\.)*)',?\s*\n?\s*link: '(\/p\/[^']+)'/g)) {
    seen.set(match[2].slice(1), match[1].replace(/\\\\'/g, \"'\"));
}
console.log('unique ids:', seen.size);
writeFileSync('data/medium-ids.json', JSON.stringify([...seen].map(([id, title]) => ({ id, title })), null, 4) + '\n');
"
```

Expected: `unique ids: 71`

若數字不是 71，config 的排版讓 regex 漏抓了。改用更寬鬆的兩段式抽法：先 `matchAll(/\{[^}]*\}/g)` 取出每個物件，再各自抓 `title` 與 `link`。

- [ ] **Step 2: 開一個獨立的 headful 瀏覽器並停在 Medium**

用 `browser` 工具：

```json
{
    "action": "open",
    "name": "medium",
    "url": "https://medium.com/@sean1093",
    "wait_until": "domcontentloaded",
    "timeout": 120,
    "app": {
        "path": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "args": [
            "--user-data-dir=/tmp/omp-chrome-backfill",
            "--no-first-run",
            "--no-default-browser-check"
        ]
    }
}
```

Expected: 標題是 `Medium`（不是 `Attention Required! | Cloudflare`），URL 落在 `https://sean1093.medium.com/`

- [ ] **Step 3: 在頁面內抓 71 筆 metadata**

用 `browser` 的 `run`，把 `data/medium-ids.json` 的內容貼進 `IDS` 常數（`run` 在 Node 端執行，`tab.evaluate` 的 callback 在頁面內執行，兩者不共享作用域，所以要用第二個參數傳進去）：

```js
const { readFileSync, writeFileSync } = await import('node:fs');
const ids = JSON.parse(readFileSync('data/medium-ids.json', 'utf8'));
const fetched = await tab.evaluate(async (entries) => {
    const out = [];
    for (const entry of entries) {
        const postId = entry.id.replace(/^p\//, '');
        try {
            const response = await fetch(
                `https://medium.com/p/${postId}?format=json`,
                { credentials: 'omit' }
            );
            const text = await response.text();
            const json = JSON.parse(text.replace(/^\]\)\}while\(1\);<\/x>/, ''));
            const value = json.payload.value;
            const virtuals = value.virtuals ?? {};
            out.push({
                id: entry.id,
                status: response.status,
                firstPublishedAt: value.firstPublishedAt,
                tags: (virtuals.tags ?? []).map((tag) => tag.slug),
                subtitle: virtuals.subtitle ?? null,
                imageId: virtuals.previewImage?.imageId ?? null,
            });
        } catch (error) {
            out.push({ id: entry.id, error: String(error) });
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return out;
}, ids);
writeFileSync('data/medium-raw.json', JSON.stringify(fetched, null, 4) + '\n');
return {
    total: fetched.length,
    failed: fetched.filter((entry) => entry.error || entry.status !== 200).length,
};
```

Expected: `{ total: 71, failed: 0 }`。若 `failed > 0`，把失敗的 id 單獨重跑一次；仍失敗者在 Step 4 會保留 `date: undefined`（spec §10 允許，排序時落在有日期者之後）。

- [ ] **Step 4: 產生 seed 檔**

Create `scripts/backfill-medium.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import type { Post } from '../src/types/post.ts';
import { deriveTopic } from '../src/lib/classify.ts';

interface RawEntry {
    id: string;
    firstPublishedAt?: number;
    tags?: string[];
    subtitle?: string | null;
    imageId?: string | null;
}

const titles = new Map<string, string>(
    (
        JSON.parse(readFileSync('data/medium-ids.json', 'utf8')) as {
            id: string;
            title: string;
        }[]
    ).map((entry) => [entry.id, entry.title])
);
const raw = JSON.parse(readFileSync('data/medium-raw.json', 'utf8')) as RawEntry[];

const seed: Post[] = raw.map((entry) => {
    const title = titles.get(entry.id)!;
    const tags = entry.tags ?? [];
    return {
        id: entry.id,
        source: 'medium',
        title,
        url: `https://medium.com/${entry.id}`,
        topic: deriveTopic('medium', title, tags),
        tags,
        ...(entry.firstPublishedAt
            ? { date: new Date(entry.firstPublishedAt).toISOString() }
            : {}),
        ...(entry.subtitle ? { summary: entry.subtitle } : {}),
        ...(entry.imageId
            ? { image: `https://miro.medium.com/v2/resize:fit:640/${entry.imageId}` }
            : {}),
    };
});

writeFileSync('data/seed.medium.json', `${JSON.stringify(seed, null, 4)}\n`);
console.log(`seeded ${seed.length} medium posts`, {
    dated: seed.filter((post) => post.date !== undefined).length,
    algo: seed.filter((post) => post.topic === 'algo').length,
    tech: seed.filter((post) => post.topic === 'tech').length,
});
```

Run: `node scripts/backfill-medium.ts`
Expected: `seeded 71 medium posts { dated: 71, algo: ~34, tech: ~37 }`

- [ ] **Step 5: 關掉瀏覽器、清掉中間檔、重跑 sync**

```bash
rm data/medium-ids.json data/medium-raw.json
yarn sync
```

用 `browser` 工具關掉瀏覽器並結束程序：`{"action":"close","name":"medium","kill":true}`。

Expected: `wrote 215 posts { blogger: 134, travel: 134, medium: 81, ... }`

推導：Blogger 134 ＋ Medium（seed 71 ＋ RSS 10）＝ 215。RSS 那 10 篇實測全部不在舊 config 裡，所以不會與 seed 重疊。若你在這期間發了新文章，數字會往上走——以腳本實際輸出為準，並把數字寫進 commit 訊息。

- [ ] **Step 6: Commit**

```bash
yarn format
git add scripts/backfill-medium.ts data/seed.medium.json data/posts.json
git commit -m "feat: backfill medium history into seed data"
```

---

### Task 9: 前端選取器

**Files:**
- Create: `src/lib/url.ts`
- Create: `src/lib/posts.ts`
- Create: `tests/selectors.test.ts`

**Interfaces:**
- Consumes: `data/posts.json`、`COUNTRIES`／`TRAVEL_TYPES`
- Produces:
  - `withUtm(url: string): string`
  - `posts: Post[]`、`FacetValue { value: string; count: number }`
  - `filterPosts(filter: PostFilter): Post[]`，`PostFilter { topic?, place?, type?, tag?, lang?, q? }`
  - `latest(count: number): Post[]`、`countsByTopic(): Record<Topic, number>`
  - `countryFacets(): FacetValue[]`、`placeFacets(country: string): FacetValue[]`、`typeFacets(): FacetValue[]`、`tagFacets(topic: Topic, limit?: number): FacetValue[]`、`countryOfPlace(place: string): string | undefined`

- [ ] **Step 1: 寫失敗的測試**

Create `tests/selectors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { withUtm } from '../src/lib/url.ts';
import {
    countryFacets,
    countryOfPlace,
    countsByTopic,
    filterPosts,
    latest,
    placeFacets,
    posts,
    tagFacets,
    typeFacets,
} from '../src/lib/posts.ts';

describe('withUtm', () => {
    it('adds the utm source', () => {
        expect(withUtm('https://medium.com/p/abc')).toBe(
            'https://medium.com/p/abc?utm_source=personal_outline'
        );
    });

    it('keeps an existing query intact', () => {
        expect(withUtm('https://example.com/a?ref=x')).toBe(
            'https://example.com/a?ref=x&utm_source=personal_outline'
        );
    });
});

describe('posts data', () => {
    it('ships the whole index with unique ids', () => {
        expect(posts.length).toBeGreaterThanOrEqual(205);
        expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length);
    });

    it('is sorted newest first', () => {
        const dated = posts.filter((post) => post.date !== undefined);
        const sorted = [...dated].sort((a, b) => b.date!.localeCompare(a.date!));
        expect(dated.map((post) => post.id)).toEqual(sorted.map((post) => post.id));
    });
});

describe('filterPosts', () => {
    it('hides english translations by default and shows them on request', () => {
        expect(filterPosts({}).filter((post) => post.lang === 'en')).toEqual([]);
        expect(filterPosts({ lang: 'en' })).toHaveLength(4);
    });

    it('combines place and type', () => {
        const kyotoBars = filterPosts({
            topic: 'travel',
            place: '京都',
            type: '酒吧',
        });
        expect(kyotoBars.length).toBeGreaterThan(0);
        for (const post of kyotoBars) {
            expect(post.tags).toContain('京都');
            expect(post.tags).toContain('酒吧');
        }
    });

    it('searches title, tags and summary', () => {
        const hits = filterPosts({ q: '京都' });
        expect(hits.length).toBeGreaterThan(0);
        expect(filterPosts({ q: 'LEETCODE' }).length).toBeGreaterThan(0);
    });
});

describe('facets', () => {
    it('counts the five countries', () => {
        const counts = Object.fromEntries(
            countryFacets().map((facet) => [facet.value, facet.count])
        );
        expect(counts['日本']).toBeGreaterThanOrEqual(50);
        expect(counts['台灣']).toBeGreaterThanOrEqual(44);
        expect(counts['澳洲']).toBeGreaterThanOrEqual(24);
        expect(counts['馬來西亞']).toBeGreaterThanOrEqual(11);
        expect(counts['泰國']).toBe(4);
    });

    it('lists the places of a country', () => {
        expect(placeFacets('日本').length).toBeGreaterThanOrEqual(18);
        expect(placeFacets('台灣').length).toBeGreaterThanOrEqual(11);
        expect(placeFacets('泰國').map((facet) => facet.value)).toContain('曼谷');
    });

    it('resolves the country of a place from the data', () => {
        expect(countryOfPlace('京都')).toBe('日本');
        expect(countryOfPlace('台北')).toBe('台灣');
        expect(countryOfPlace('不存在的地方')).toBeUndefined();
    });

    it('counts travel types', () => {
        const counts = Object.fromEntries(
            typeFacets().map((facet) => [facet.value, facet.count])
        );
        expect(counts['住宿']).toBe(49);
        expect(counts['景點']).toBe(29);
        expect(counts['交通']).toBe(1);
    });

    it('caps tech tags to the most common ones', () => {
        expect(tagFacets('tech', 20).length).toBeLessThanOrEqual(20);
    });
});

describe('home data', () => {
    it('returns the newest posts across sources', () => {
        const newest = latest(10);
        expect(newest).toHaveLength(10);
        expect(newest.every((post) => post.lang !== 'en')).toBe(true);
    });

    it('counts all three topics', () => {
        const counts = countsByTopic();
        expect(counts.travel).toBeGreaterThanOrEqual(130);
        expect(counts.tech + counts.algo).toBeGreaterThanOrEqual(71);
    });
});
```

`countsByTopic().travel` 期望 130 是因為 134 篇裡有 4 篇英文版被預設排除。若 Task 8 之後 Blogger 有新文章，這些數字要照 `yarn sync` 的實際輸出調整——調數字，不要放寬斷言。

- [ ] **Step 2: 跑測試確認失敗**

Run: `yarn test tests/selectors.test.ts`
Expected: FAIL — 找不到 `../src/lib/url.ts`

- [ ] **Step 3: 寫 withUtm**

Create `src/lib/url.ts`:

```ts
const UTM_SOURCE = 'personal_outline';

export function withUtm(url: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set('utm_source', UTM_SOURCE);
    return parsed.toString();
}
```

- [ ] **Step 4: 寫選取器**

Create `src/lib/posts.ts`:

```ts
import type { Post, Topic } from '../types/post.ts';
import { COUNTRIES, splitPlaces, TRAVEL_TYPES } from './classify.ts';
import data from '../../data/posts.json';

export const posts = data as unknown as Post[];

export interface FacetValue {
    value: string;
    count: number;
}

export interface PostFilter {
    topic?: Topic;
    place?: string;
    type?: string;
    tag?: string;
    lang?: 'en';
    q?: string;
}

const normalize = (value: string) => value.normalize('NFKC').toLowerCase();

export function filterPosts(filter: PostFilter): Post[] {
    const query = filter.q === undefined ? '' : normalize(filter.q.trim());
    return posts.filter((post) => {
        const wantsEnglish = filter.lang === 'en';
        if (wantsEnglish !== (post.lang === 'en')) return false;
        if (filter.topic !== undefined && post.topic !== filter.topic) return false;
        for (const required of [filter.place, filter.type, filter.tag]) {
            if (required !== undefined && !post.tags.includes(required)) return false;
        }
        if (query !== '') {
            const haystack = normalize(
                [post.title, post.summary ?? '', ...post.tags].join(' ')
            );
            if (!haystack.includes(query)) return false;
        }
        return true;
    });
}

export function latest(count: number): Post[] {
    return filterPosts({}).slice(0, count);
}

export function countsByTopic(): Record<Topic, number> {
    const counts: Record<Topic, number> = { tech: 0, algo: 0, travel: 0 };
    for (const post of filterPosts({})) counts[post.topic] += 1;
    return counts;
}

function tally(values: string[]): FacetValue[] {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function countryFacets(): FacetValue[] {
    const travel = filterPosts({ topic: 'travel' });
    return COUNTRIES.map((country) => ({
        value: country,
        count: travel.filter((post) => post.tags.includes(country)).length,
    })).filter((facet) => facet.count > 0);
}

export function placeFacets(country: string): FacetValue[] {
    return tally(
        filterPosts({ topic: 'travel', place: country }).flatMap(
            (post) => splitPlaces(post.tags).places
        )
    );
}

export function typeFacets(): FacetValue[] {
    return tally(
        filterPosts({ topic: 'travel' }).flatMap((post) =>
            post.tags.filter((tag) => TRAVEL_TYPES.includes(tag))
        )
    );
}

export function tagFacets(topic: Topic, limit = 20): FacetValue[] {
    return tally(filterPosts({ topic }).flatMap((post) => post.tags)).slice(0, limit);
}

export function countryOfPlace(place: string): string | undefined {
    for (const post of filterPosts({ topic: 'travel', place })) {
        const country = post.tags.find((tag) => COUNTRIES.includes(tag));
        if (country !== undefined) return country;
    }
    return undefined;
}
```

- [ ] **Step 5: 跑測試確認通過**

Run: `yarn test`
Expected: 全部 passed（含前面幾個 task 的測試）

- [ ] **Step 6: Commit**

```bash
yarn format
git add src/lib/url.ts src/lib/posts.ts tests/selectors.test.ts
git commit -m "feat: add post selectors and facet counts"
```

---

### Task 10: 路由切換、Home 頁與分享用 meta

**Files:**
- Create: `src/components/PostList.tsx`
- Create: `src/pages/Home.tsx`
- Modify: `src/App.tsx`
- Modify: `index.html`

**Interfaces:**
- Consumes: `latest`、`countsByTopic`、`filterPosts`、`withUtm`
- Produces: `PostList`（props：`{ posts: Post[] }`）；路由 `/` 指向 `Home`，Router 為 `BrowserRouter basename="/outline"`

- [ ] **Step 1: 寫 PostList**

Create `src/components/PostList.tsx`:

```tsx
import React from 'react';
import type { Post } from '../types/post.ts';
import { withUtm } from '../lib/url.ts';
import { theme } from '../styles/theme';

const SOURCE_LABEL: Record<Post['source'], string> = {
    medium: 'Medium',
    blogger: 'Blog',
};

const PostList: React.FC<{ posts: Post[] }> = ({ posts }) => {
    if (posts.length === 0) {
        return (
            <p style={{ color: theme.colors.textSecondary }}>沒有符合條件的文章</p>
        );
    }
    return (
        <ul
            style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.lg,
            }}
        >
            {posts.map((post) => (
                <li
                    key={post.id}
                    style={{
                        display: 'flex',
                        gap: theme.spacing.md,
                        alignItems: 'flex-start',
                    }}
                >
                    {post.image !== undefined && (
                        <img
                            src={post.image}
                            alt=""
                            loading="lazy"
                            width={112}
                            height={84}
                            style={{
                                objectFit: 'cover',
                                borderRadius: '8px',
                                flexShrink: 0,
                                background: theme.colors.border,
                            }}
                        />
                    )}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: theme.spacing.xs,
                        }}
                    >
                        <a
                            className="list-link"
                            href={withUtm(post.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...theme.typography.body,
                                fontWeight: '600',
                                color: theme.colors.textPrimary,
                                textDecoration: 'none',
                            }}
                        >
                            {post.title}
                        </a>
                        <span
                            style={{
                                ...theme.typography.small,
                                color: theme.colors.textSecondary,
                            }}
                        >
                            {post.date?.slice(0, 10) ?? '日期不明'} ·{' '}
                            {SOURCE_LABEL[post.source]}
                            {post.tags.length > 0 && ` · ${post.tags.join('、')}`}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default PostList;
```

- [ ] **Step 2: 寫 Home 頁**

Create `src/pages/Home.tsx`:

```tsx
import { useState } from 'react';
import Section from '../components/Section';
import Card from '../components/Card';
import PostList from '../components/PostList';
import { countsByTopic, filterPosts, latest } from '../lib/posts.ts';
import { theme } from '../styles/theme';

const TOPICS = [
    { topic: 'tech' as const, title: 'Tech', emoji: '🛠', description: '軟體開發、前端、雲端與 AI 學習筆記' },
    { topic: 'algo' as const, title: 'Algorithm', emoji: '🧠', description: '演算法筆記與 LeetCode 解題紀錄' },
    { topic: 'travel' as const, title: 'Travel', emoji: '✈️', description: '住宿、景點、美食與酒吧踩點紀錄' },
];

const Home = () => {
    const [query, setQuery] = useState('');
    const counts = countsByTopic();
    const trimmed = query.trim();
    const results = trimmed === '' ? [] : filterPosts({ q: trimmed });

    return (
        <Section>
            <h1 style={{ ...theme.typography.h1, color: theme.colors.textPrimary }}>
                Sean 的文章索引
            </h1>
            <p style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                散落在 Medium 與 Blogger 的文章，集中在這裡。
            </p>

            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋標題、標籤或摘要"
                style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.lg,
                    borderRadius: '12px',
                    border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.surface,
                    ...theme.typography.body,
                }}
            />

            {trimmed === '' ? (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: theme.spacing.lg,
                            marginTop: theme.spacing.xl,
                        }}
                    >
                        {TOPICS.map((entry) => (
                            <Card
                                key={entry.topic}
                                title={`${entry.title} (${counts[entry.topic]})`}
                                description={entry.description}
                                emoji={entry.emoji}
                                link={`/t/${entry.topic}`}
                            />
                        ))}
                    </div>
                    <h2
                        style={{
                            ...theme.typography.h2,
                            color: theme.colors.textPrimary,
                            marginTop: theme.spacing.xxl,
                        }}
                    >
                        最新文章
                    </h2>
                    <PostList posts={latest(10)} />
                </>
            ) : (
                <>
                    <h2
                        style={{
                            ...theme.typography.h2,
                            color: theme.colors.textPrimary,
                            marginTop: theme.spacing.xl,
                        }}
                    >
                        搜尋結果（{results.length}）
                    </h2>
                    <PostList posts={results} />
                </>
            )}
        </Section>
    );
};

export default Home;
```

- [ ] **Step 3: 換 Router 與路由表**

Replace `src/App.tsx` 全部內容：

```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StickyHeader from './components/StickyHeader';
import Home from './pages/Home';
import Topic from './pages/Topic';

const App: React.FC = () => {
    return (
        <Router basename="/outline">
            <StickyHeader />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/t/:topic" element={<Topic />} />
            </Routes>
        </Router>
    );
};

export default App;
```

`src/pages/Topic.tsx` 在 Task 11 才建立，但 `src/App.tsx` 現在就 import 它。**這一步必須同時建立佔位檔**，否則這個 task 的 commit 會讓 `yarn build` 壞掉，違反「每個 task 結束都是可獨立驗證的交付」。佔位內容如下，Task 11 會整檔替換：

```tsx
const Topic = () => null;

export default Topic;
```

- [ ] **Step 4: 補分享用 meta**

Replace `index.html` 的 `<head>` 內容（保留 `<body>` 不動）：

```html
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/outline/favicon.svg" />
        <title>Sean 的文章索引</title>
        <meta
            name="description"
            content="Sean 的文章索引：Medium 的技術與演算法筆記，Blogger 的旅遊住宿、景點與酒吧紀錄，集中在一個入口。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Sean 的文章索引" />
        <meta
            property="og:description"
            content="Medium 技術筆記 + Blogger 旅遊紀錄的統一入口。"
        />
        <meta property="og:url" content="https://sean1093.github.io/outline/" />
        <meta name="twitter:card" content="summary" />
    </head>
```

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#2563eb" />
    <path
        d="M18 20h28M18 32h28M18 44h18"
        stroke="#ffffff"
        stroke-width="6"
        stroke-linecap="round"
    />
</svg>
```

- [ ] **Step 5: Commit**

```bash
yarn format
git add src/components/PostList.tsx src/pages/Home.tsx src/App.tsx index.html public/favicon.svg
git commit -m "feat: add home page with latest posts and search"
```

---

### Task 11: Topic 頁與 URL 驅動的 facet

**Files:**
- Create: `src/components/FacetRow.tsx`
- Create: `src/pages/Topic.tsx`（若 Task 10 建了佔位檔則為 Modify）

**Interfaces:**
- Consumes: `filterPosts`、`countryFacets`、`placeFacets`、`typeFacets`、`tagFacets`、`countryOfPlace`、`PostList`、`SubMenu`
- Produces: 路由 `/t/:topic`，支援 query `place`、`type`、`tag`、`lang`

- [ ] **Step 1: 寫 FacetRow**

Create `src/components/FacetRow.tsx`:

```tsx
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
```

- [ ] **Step 2: 寫 Topic 頁**

Create `src/pages/Topic.tsx`:

```tsx
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

    const results = filterPosts({
        topic,
        ...(place === null ? {} : { place }),
        ...(type === null ? {} : { type }),
        ...(tag === null ? {} : { tag }),
        ...(lang === undefined ? {} : { lang }),
    });

    return (
        <Section>
            <h1 style={{ ...theme.typography.h1, color: theme.colors.textPrimary }}>
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
```

- [ ] **Step 3: 跑 dev server 並用瀏覽器確認**

Run: `yarn dev`（背景執行），然後用 `browser` 工具開 `http://localhost:5173/outline/t/travel?place=%E4%BA%AC%E9%83%BD&type=%E9%85%92%E5%90%A7`

Expected：頁面直接帶著「京都」與「酒吧」兩個選中狀態，清單只剩京都的酒吧文章；點「全部類型」後 URL 的 `type` 消失而 `place=京都` 保留。

- [ ] **Step 4: Commit**

```bash
yarn format
git add src/components/FacetRow.tsx src/pages/Topic.tsx
git commit -m "feat: add topic page with url-driven place and type facets"
```

---

### Task 12: 舊實作清除與導覽更新

**Files:**
- Delete: `src/config/techConfig.ts`、`src/config/algoConfig.ts`、`src/config/travelConfig.ts`、`src/config/common.ts`
- Delete: `src/pages/Outline.tsx`、`src/pages/Tech.tsx`、`src/pages/Travel.tsx`、`src/pages/Algorithm.tsx`
- Delete: `src/components/List.tsx`
- Modify: `src/components/StickyHeader.tsx:111-184`
- Modify: `src/types/common.ts`
- Modify: `README.md`
- Modify: `guide.md`

**Interfaces:**
- Consumes: 全部新頁面已就位（Task 10、11）
- Produces: repo 內不再有舊 config 與舊四頁；導覽指向 `/t/:topic`

- [ ] **Step 1: 刪除舊檔**

```bash
git rm src/config/techConfig.ts src/config/algoConfig.ts src/config/travelConfig.ts src/config/common.ts
git rm src/pages/Outline.tsx src/pages/Tech.tsx src/pages/Travel.tsx src/pages/Algorithm.tsx
git rm src/components/List.tsx
```

- [ ] **Step 2: 清掉只被 List 使用的型別**

`src/types/common.ts` 的 `ListProps` 仍被 `Section.tsx` 的 `ListContainer` 使用，**保留**。`CardProps` 由 `Card.tsx` 自己宣告，`src/types/common.ts` 裡那份是重複的死碼，刪掉它；`MenuItem` 已無人使用，也刪掉。刪完後 `src/types/common.ts` 只留 `BaseProps`、`SectionProps`、`ListProps`。

- [ ] **Step 3: 改導覽（順手收掉 8 份重複的 Link）**

把 `src/components/StickyHeader.tsx` 的 `return (...)` 區塊（第 111 行到 `</header>`）換成：

```tsx
    const NAV_ITEMS = [
        { to: '/', label: 'Home' },
        { to: '/t/travel', label: 'Travel' },
        { to: '/t/tech', label: 'Tech' },
        { to: '/t/algo', label: 'Algorithm' },
    ];

    const renderNav = (style: React.CSSProperties) => (
        <nav style={style}>
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    style={
                        location.pathname === item.to ? activeLinkStyle : linkStyle
                    }
                    onClick={() => setIsMenuOpen(false)}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );

    return (
        <header style={headerStyle}>
            <Link to="/" style={titleStyle}>
                <span>📚</span> Sean's Notes
            </Link>
            {isMobile ? (
                <>
                    <button
                        style={menuButtonStyle}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                    {renderNav(mobileNavStyle)}
                </>
            ) : (
                renderNav(navStyle)
            )}
        </header>
    );
```

`NAV_ITEMS` 與 `renderNav` 放在既有 style 常數之後、`return` 之前。

- [ ] **Step 4: 改文件**

`README.md` 換成與現實一致的內容：把「Deployment: Vercel」改成 GitHub Pages（`https://sean1093.github.io/outline`）、刪掉 `SEO optimized` 與 `CSS-in-JS` 這兩個不成立的宣稱、加一節說明資料流（feed → `yarn sync` → `data/posts.json` → 每日 Action）、指出 `data/overrides.json` 是唯一需要人工介入的地方。

`guide.md` 的「架構」段落已過期（`/config` 放連結、`Outline.tsx` 是主頁），改成：`/data` 是生成的文章索引、`/scripts` 是同步腳本、`/src/lib` 是分類與選取器、`/src/pages` 只有 Home 與 Topic。

- [ ] **Step 5: 確認沒有殘留引用**

```bash
yarn lint
yarn test
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const hits = execSync('git grep -n -e HashRouter -e techConfig -e algoConfig -e travelConfig -e bloggerDomain -e mediumDomain -- src || true').toString();
console.log(hits === '' ? 'clean' : hits);
"
```

Expected: `yarn lint` 無 error、`yarn test` 全綠、最後印出 `clean`

- [ ] **Step 6: Commit**

```bash
yarn format
git add -A
git commit -m "refactor: drop hand-maintained configs and legacy pages"
```

---

### Task 13: 每日排程與自動部署

**Files:**
- Create: `.github/workflows/sync.yml`

**Interfaces:**
- Consumes: `yarn sync`、`yarn build`、`predeploy` 的 404 fallback
- Produces: 每日自動更新 `data/posts.json` 並部署 gh-pages

- [ ] **Step 1: 寫 workflow**

Create `.github/workflows/sync.yml`:

```yaml
name: sync-and-deploy

on:
    schedule:
        - cron: '0 18 * * *'
    workflow_dispatch:

permissions:
    contents: write

concurrency:
    group: sync-and-deploy
    cancel-in-progress: false

jobs:
    sync:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version: '24'
                  cache: yarn

            - run: yarn install --frozen-lockfile

            - name: Sync feeds
              run: yarn sync

            - name: Run tests
              run: yarn test

            - name: Commit index when it changed
              run: |
                  if git diff --quiet data/posts.json; then
                      echo "no new posts"
                  else
                      git config user.name "github-actions[bot]"
                      git config user.email "github-actions[bot]@users.noreply.github.com"
                      git add data/posts.json
                      git commit -m "chore: sync posts index"
                      git push
                  fi

            - name: Build
              run: |
                  yarn build
                  cp dist/index.html dist/404.html

            - uses: peaceiris/actions-gh-pages@v4
              with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
                  publish_dir: ./dist
```

`yarn sync` 失敗時（feed 掛掉、回空）整個 job 紅燈且不會 commit，`data/posts.json` 保留上一版——這是 spec §10 要的行為，由腳本的 throw 保證。

測試放在 sync 之後：`tests/selectors.test.ts` 斷言的是真實資料的數字，所以它同時是「feed 資料有沒有異常變形」的守門員。若因為你發了新文章導致篇數斷言失敗，更新測試裡的數字即可。

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/sync.yml
git commit -m "ci: sync feeds daily and deploy to gh-pages"
```

- [ ] **Step 3: 手動觸發驗證**

```bash
git push
gh workflow run sync-and-deploy
gh run watch
```

Expected: job 綠燈；因為 `data/posts.json` 剛剛才產生，這次應該印出 `no new posts` 且仍完成部署。

---

### Task 14: 驗收

**Files:** 無（只驗證）

- [ ] **Step 1: 資料驗收（spec §13.1、§13.2）**

```bash
yarn sync
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const blogger = posts.filter((post) => post.source === 'blogger');
const medium = posts.filter((post) => post.source === 'medium');
const COUNTRIES = ['台灣', '日本', '泰國', '澳洲', '馬來西亞'];
const TYPES = ['住宿', '酒吧', '景點', '美食', '交通', '行程'];
console.log('unique ids', new Set(posts.map((post) => post.id)).size, 'of', posts.length);
console.log('blogger', blogger.length, 'medium', medium.length);
console.log('blogger missing date', blogger.filter((post) => !post.date).length);
console.log('blogger missing image', blogger.filter((post) => !post.image).length);
console.log('blogger missing type', blogger.filter((post) => !post.tags.some((tag) => TYPES.includes(tag))).length);
console.log('blogger missing country', blogger.filter((post) => !post.tags.some((tag) => COUNTRIES.includes(tag))).length);
"
```

Expected: `unique ids` 等於總數、`blogger 134`、`medium >= 71`、四個 `missing` 全為 0

- [ ] **Step 2: 測試與建置（spec §13.3）**

```bash
yarn test
yarn lint
yarn build
```

Expected: 測試全綠、lint 無 error、build 成功

- [ ] **Step 3: 瀏覽器驗收（spec §13.4）**

`yarn dev` 之後用 `browser` 工具依序確認：

1. `http://localhost:5173/outline/` — 最新 10 篇日期遞減、三張 topic 卡片的篇數與 `countsByTopic` 一致、卡片可點進 `/t/...`。
2. 在搜尋框輸入「京都」— 同時出現 Blogger 的京都文章與（若有）Medium 文章。
3. `http://localhost:5173/outline/t/travel?place=%E4%BA%AC%E9%83%BD&type=%E9%85%92%E5%90%A7` — 直接帶兩個過濾狀態。
4. 在 travel 頁點各國家，確認地點 chips 篇數為 日本 18／台灣 11／澳洲 3／馬來西亞 1／泰國 1。
5. 點一篇文章外連，確認網址帶 `utm_source=personal_outline` 且原有 query 沒被破壞。
6. `http://localhost:5173/outline/t/nope` — 轉回首頁。
7. 縮到 375px 寬，確認 header 收成漢堡選單、卡片與清單不溢出。

- [ ] **Step 4: 部署驗收（spec §13.5）**

開 `https://sean1093.github.io/outline/`，確認首頁正常、`https://sean1093.github.io/outline/t/travel?place=日本` 深連結直接可開（驗證 404.html fallback）。

- [ ] **Step 5: 把實際數字回填 spec**

若 Blogger 或 Medium 篇數與 spec §4／§13 記錄的實測值不同（因為期間有新文章），更新 spec 的數字並註明量測日期。

```bash
git add -A
git commit -m "docs: record acceptance numbers"
```

---

## Self-Review

**Spec 覆蓋檢查：**

| Spec 段落 | 實作於 |
| --- | --- |
| §5 資料流、append-only、overrides 分層 | Task 6、7 |
| §6 `Post` schema | Task 2 |
| §7.1 `topic` 有序規則 | Task 2 |
| §7.2 兩個 facet 存在同一 `tags` | Task 5（normalize 寫入）、Task 9（facet 讀出） |
| §7.3 地點：5 國常數、地點層、跨國、4 篇 overrides、不做三層 | Task 4、7 Step 4、9 |
| §7.4 類型 a→b→c 與順序 | Task 3 |
| §8 Home／Topic／facet query／搜尋／BrowserRouter／utm／meta | Task 10、11 |
| §9 Blogger 免 backfill、Medium 71 筆 | Task 8 |
| §10 錯誤處理與退化 | Task 5（缺圖降級）、6（排序與 union）、7（feed 空則 throw）、10（`日期不明`） |
| §11 檔案異動清單 | Task 1、12 |
| §12 測試策略五項 | Task 1、2、3、4、5、6 |
| §13 驗收標準六項 | Task 14 |

**兩處實作細節在寫計畫時實測後修正，spec 已同步更新（§8、§11），計畫與 spec 目前一致：**

1. gh-pages 的 SPA fallback 從 `public/404.html` 改為建置後 `cp dist/index.html dist/404.html`。原因：`public/` 的檔案是原樣複製，拿不到 build 後的資產雜湊，載進去會是空殼。
2. 不加執行 TS 的工具（tsx／ts-node）。原因：Node 24 原生執行 `.ts`（已實測），`node scripts/sync.ts` 直接可跑。代價寫進 Global Constraints：Node 載入的 `.ts` 必須帶副檔名、型別匯入用 `import type`、不得用 enum／namespace／parameter properties。

**型別一致性檢查：** `Post`／`Override` 只在 Task 2 定義，後續全部 `import type`；`FacetValue` 只在 Task 9 定義，Task 11 由 `../lib/posts.ts` 匯入；`classifyTravelType(title, labels)`、`deriveTopic(source, title, tags)`、`splitPlaces(tags)`、`mergePosts(existing, incoming, overrides?)`、`filterPosts(filter)` 的簽名在定義與呼叫處一致。`summarize` 由 `scripts/lib/blogger.ts` 匯出並被 `scripts/lib/medium.ts` 重用，不重複實作。

**`tests/selectors.test.ts` 對真實資料的斷言策略（pre-flight 裁決）：** 成長性數字（總篇數、各國家／地點篇數、topic 篇數）用下限斷言，因為 Task 13 的每日 job 會在 sync 之後跑測試——若用精確值，你每發一篇文章 CI 就變紅、部署被擋。結構性不變量維持精確：唯一 id 等於總數、日期遞減排序、英文版 4 篇、`missing date/image/type/country` 皆為 0。這樣既擋得住「feed 變形導致資料 silently 變少」，也不會因為你正常發文而紅燈。fixture 型測試（55/55 分類迴歸、fixture 134 篇）維持精確，因為 fixture 是凍結的。
