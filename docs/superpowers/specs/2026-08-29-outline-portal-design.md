# Outline — 自動化文章索引站設計

- 日期：2026-08-29
- 狀態：待審閱
- 定位：architectural（資料模型、路由、部署皆變動）

## 1. 目標

把 `outline` 從「手工維護的連結清單」改成「由 feed 驅動的文章索引站」。

- 單一入口，聚合 Medium（技術／演算法）與 Blogger（旅遊）兩個來源。
- **零人工貼連結**：新文章發佈後由排程自動出現。
- 分類、標籤、日期、縮圖全部從來源 metadata 推導。
- 首頁回答「他最近寫了什麼」；分類頁可分享、可收藏。

## 2. 非目標

- 不托管內容。文章正本永遠留在 Medium／Blogger，本站只導流。
- 不做 SSR／SSG。純 SPA，SEO 紅利留在平台端，這是選定路線的必然結果。
- 不做後端、資料庫、CMS、後台管理。
- 不產生 `sitemap.xml` 與 `rss.xml`。SPA 沒有 SSR，sitemap 對爬蟲無效；索引站的 RSS 目前無需求。保留 OG／description（社群分享有實質效果）。
- 不重構未被本次變動觸及的元件。

## 3. 現況問題（證據）

| 問題 | 證據 |
| --- | --- |
| 索引已經在漏 | Blogger 有 134 篇，`travelConfig.ts` 只列 55 篇 → **79 篇從未被索引**；Medium 最新 10 篇**全部**不在索引內（5 篇「AI 學習筆記」、QuadTree、4 篇 LeetCode） |
| 資料模型分裂 | `techConfig.ts` / `algoConfig.ts` / `travelConfig.ts` 三種形狀；domain 綁在頁面：`Travel.tsx:46` 寫死 `bloggerDomain`、`Algorithm.tsx:27` 寫死 `mediumDomain` |
| 單一分類假設不成立 | `/p/5bc7be208eac`（11. Container With Most Water）同時出現在 `algoConfig.ts:73` 與 `:95`，72 筆條目只有 71 個唯一 id |
| metadata 只有標題與連結 | `List.tsx:3-6`。無日期 → 無法排序、無法做「最新」 |
| 子分類無法分享 | 選單狀態只在 `useState`（`Travel.tsx:17`、`Algorithm.tsx:11`），「日本住宿」沒有自己的 URL |
| 外連 utm 會弄壞帶 query 的連結 | `List.tsx:37` 字串拼接 `?utm_source=` |
| 分享出去沒有預覽 | `index.html` 無 description／OG；favicon 指向 GitHub CDN（`index.html:10`） |
| 文件與現實不符 | `README.md:19` 宣稱 SEO optimized（實際 HashRouter SPA）、`README.md:28` 宣稱 Vercel（實際 `package.json` gh-pages） |

## 4. Feed 實測結果（2026-08-29 實際抓取）

### Medium：`https://medium.com/feed/@sean1093`

- 標題 `Stories by Sean Chou on Medium`，可匿名存取。
- 欄位：`title` / `link` / `guid` / `pubDate` / `category[]`（Medium tags）/ `content:encoded` / `dc:creator`。
- **`guid` 形如 `https://medium.com/p/<id>`**，與現有 config 的 `link: '/p/<id>'` 同構 → seed 與 feed 以 id join，無需人工對照。
- `link` 是刊物網址（`medium.com/技術筆記/...`，percent-encoded）；正規連結一律用 `https://medium.com/p/<id>`。
- **硬限制：只回最近 10 篇。** 歷史文章需 seed（見 §9）。
- 網頁端對 curl／reader 一律 403，只能靠 RSS 或真實瀏覽器。

### Blogger：`https://travel-sean.blogspot.com/feeds/posts/default?alt=json&max-results=150&start-index=N`

- 全歷史可抓：**134 篇**（單次上限 150，需 `start-index` 分頁；實測一次取滿 134）。
- 欄位：`published` / `updated` / `category[].term`（label）/ `content` / `media$thumbnail`（134/134）/ `link[rel=alternate]` / `georss$point`（133/134）。
- 34 個 label **全部是地名**（台北、東京、日本、曼谷、珀斯…）加一個 `英文版本`（4 篇）。
- 例外：那 4 篇 `英文版本` **只有** `英文版本` 一個 label，沒有任何地名 label。
- 反向檢查：現有 55 個 config 連結全部存在於 feed，0 死連結。

## 5. 架構與資料流

```mermaid
graph LR
  M["Medium RSS<br/>最新 10 篇"] --> N[normalize]
  B["Blogger JSON<br/>134 篇全歷史"] --> N
  S["data/seed.medium.json<br/>71 筆 Medium 歷史"] --> N
  N --> MG["merge<br/>append-only, key = id"]
  O["data/overrides.json"] --> MG
  MG --> P["data/posts.json（commit 進 repo）"]
  P --> U["UI: Home / Topic"]
```

真相來源分層，責任不重疊：

- **來源 feed**：文章是否存在、標題、日期、tags、縮圖。
- **`seed.medium.json`**：Medium RSS 拿不到的歷史（凍結，只在 backfill 時寫）。
- **`overrides.json`**：例外修正，形狀 `Record<PostId, { topic?: Topic; addTags?: string[]; hidden?: true }>`。`hidden` 在 sync 階段就把該筆排除、不寫進 `posts.json`（因此 `Post` 不需要 `hidden` 欄位）。預期長度接近 0；不是常態工作流，也不提供置頂功能。
- **`posts.json`**：生成物，commit 進 repo。可審、可回溯、build 不依賴網路。

`merge` 為 **append-only**：以 `id` 為 key，feed 有的覆寫欄位，feed 沒有的既有項目保留。這讓 Medium 的 10 篇上限、平台暫時性故障都不會造成資料消失，最壞情況是「停止更新」。

## 6. 資料模型

```ts
export type Source = 'medium' | 'blogger';
export type Topic = 'tech' | 'algo' | 'travel';

export interface Post {
  id: string;          // medium: 'p/<id>'；blogger: '/2021/05/slug.html'
  source: Source;
  title: string;
  url: string;         // canonical 絕對網址
  topic: Topic;
  tags: string[];      // 去重、保序
  date?: string;       // ISO 8601；缺值見 §10
  summary?: string;    // content 首段純文字，截斷 140 字
  image?: string;      // media$thumbnail 或 content 首張 img
  geo?: [number, number];  // Blogger georss，保留給未來地圖視圖，本次不渲染
  lang?: 'en';         // 只在英文版本標記；未標記即中文
}
```

- `id` 是唯一鍵，也是 dedup 依據（解掉 §3 的重複條目問題）。
- 一篇文章可帶多個 tag，取代原本「一篇只能屬於一個 category」的結構。
- 205 筆 × ~250B ≈ **50KB 單一 JSON**，隨 bundle 一起送。不需分頁、不需搜尋服務。

## 7. 分類規則

### 7.1 `topic`

| 順序 | 條件 | 結果 |
| --- | --- | --- |
| 1 | `overrides.json` 指定 `topic` | 採用該值 |
| 2 | `source === 'blogger'` | `travel` |
| 3 | Medium 且 `tags` 含 `algorithms` / `leetcode` / `演算法` | `algo` |
| 4 | Medium 且標題含 `[LeetCode 解題紀錄]` / `演算法筆記` / `基礎演算法`（seed 沒有 tags，靠這條） | `algo` |
| 5 | 其餘 Medium | `tech` |

實測依據：feed 內 5 篇演算法類文章（QuadTree ＋ 4 篇 LeetCode）全部帶 `algorithms` tag，4 篇 LeetCode 另帶 `leetcode`；AI／LLM 系列帶 `ai`、`llm` 等，落入 `tech`。

### 7.2 `tags`

- Medium：`category[]` 原樣帶入（genai、ai-agent、react…）。
- Blogger：`category[].term` 原樣帶入（地名）＋ §7.3 推導出的類型。
- `英文版本` 不進 tags，轉成 `lang: 'en'`。

### 7.3 旅遊類型（a → b → c 降級鏈）

**(a) 來源 label 優先。** Blogger label 若含類型詞（住宿／景點／酒吧／美食…）直接採用。目前 34 個 label 全是地名，所以此層現在不會命中；你日後在 Blogger 補 label，程式無須改動即生效。

**(b) 標題前綴推導。** 你的 Blogger 標題有嚴格慣例 `<地區><類型> | <名稱> | …`。取 `|` 分段後的**前兩段**串接，依序比對：

| 順序 | 類型 | pattern |
| --- | --- | --- |
| 1 | 住宿 | `住宿\|飯店\|旅館\|民宿\|hotel\|accommodation\|hostel\|ryokan\|resort` |
| 2 | 酒吧 | `酒吧\|bar\b\|居酒屋\|cocktail\|speakeasy` |
| 3 | 景點 | `景點\|attraction\|park\b` |
| 4 | 美食 | `美食\|餐廳\|咖啡\|cafe\|甜點\|早餐\|restaurant` |
| 5 | 交通 | `航空\|airlines\|機場\|鐵路\|新幹線\|租車\|jr\b` |
| 6 | 行程 | `自由行\|自助旅行\|旅遊\|行程\|懶人包\|攻略\|itinerary` |

順序是演算法的一部分，不可調換：特定性由高到低，`行程` 當收尾。只掃前兩段而非全標題，避免「`台南住宿 | 台南晶英酒店 | … | 飯店 bar`」被誤判成酒吧。

**實測（以 `travelConfig.ts` 現有 55 筆人工分類為驗證集）：正確 55、誤判 0、未命中 0（100%）。**
全庫 134 篇覆蓋率 100%，分佈：住宿 49、景點 29、美食 20、行程 20、酒吧 15、交通 1。

驗證集另外證明兩件事：只掃第一段會漏 10 篇（類型詞在第二段，如 `關西自由行 | 大阪住宿 | …`）；掃全標題會誤判 1 篇。

**(c) 安全網。** 兩層都沒中 → 不給類型 tag，文章仍可透過地名 tag、搜尋、首頁最新被找到。目前資料不會落到這層，但新標題慣例改變時不會掉資料。

**地名補救。** 4 篇 `英文版本` 沒有地名 label，改由標題前綴取地名（`Sapporo Hotel Review` → Sapporo、`Taipei Accommodation` → 台北），避免它們只剩搜尋可達。

## 8. 站台結構與路由

| 路由 | 內容 |
| --- | --- |
| `/` | 跨來源最新 10 篇（標題／日期／來源／縮圖）＋ 三個 topic 入口（附篇數）＋ 搜尋框 |
| `/t/:topic` | 該 topic 全部文章，依 `date` 遞減；上方 tag 列由該 topic 的資料算出（附篇數） |
| `/t/:topic?tag=日本` | tag 過濾。**狀態存在 URL**，可分享、可收藏、可上一頁 |
| `/t/:topic?lang=en` | 只在 Topic 頁提供的語言切換。預設兩頁都只顯示中文；首頁「最新」永遠排除 `lang: 'en'`（那 4 篇是既有中文文章的翻譯，並列只是重複） |

- 搜尋：前端比對 `title + tags + summary`，大小寫與全半角正規化後 `includes`。205 筆不需任何 library。
- Router：`HashRouter` → `BrowserRouter`，`basename="/outline"`（對齊 `vite.config.ts:6` 的 `base`）；gh-pages 需 `public/404.html` 轉址 fallback。
- 外連：`new URL()` 組出 utm，取代 `List.tsx:37` 的字串拼接。
- `index.html`：補 `description`、`og:*`、`twitter:card`，換掉 GitHub CDN favicon。
- 樣式：沿用 `styles/theme.ts` ＋ `index.css` 的 CSS 變數，不引入新樣式方案。`Outline.tsx` 那一整頁 inline 裝飾隨頁面刪除而消失。

## 9. 一次性 backfill

- **Blogger：不需要。** feed 有全部 134 篇含日期、label、縮圖。`travelConfig.ts` 直接刪除。
- **Medium：71 筆。** 現有 config 提供 id 與標題，缺日期與 tags。Medium 對非瀏覽器請求 403，故 backfill 用 `browser` 工具在 `medium.com` origin 內同源 `fetch('https://medium.com/p/<id>?format=json')` 取 `latestPublishedAt` 與 tags，一次跑完 71 筆；取不到者退回讀該頁 `<meta property="article:published_time">`。
- 產出 `data/seed.medium.json` 後 commit，`scripts/backfill-medium.ts` 保留並註明為一次性工具，不進排程。

## 10. 錯誤處理與退化行為

| 情況 | 行為 |
| --- | --- |
| 任一 feed 抓取失敗／回傳非預期結構 | 不寫檔、Action 失敗（紅燈通知）、保留上一版 `posts.json` |
| feed 少了既有文章 | append-only merge 保留該文章 |
| 同一 id 出現多次 | 後者合併進前者，`tags` 聯集去重 |
| `date` 缺值 | 排在有日期者之後（同組內以標題排序）；不進首頁「最新」模組 |
| `image` 缺值 | 卡片降級為純文字列，不留破圖框 |
| 類型與地名都推導不出 | 只以 topic 呈現，仍可搜尋 |

## 11. 檔案異動清單（clean cutover）

新增：

- `scripts/sync.ts`（fetch → normalize → classify → merge → 寫檔）
- `scripts/backfill-medium.ts`（一次性）
- `.github/workflows/sync.yml`（`cron` 每日 ＋ `workflow_dispatch`；有 diff 才 commit，接著 build＋deploy gh-pages）
- `data/posts.json`、`data/seed.medium.json`、`data/overrides.json`
- `src/lib/posts.ts`（載入與推導：topics、tags、latest、search）
- `src/pages/Home.tsx`、`src/pages/Topic.tsx`
- `public/404.html`
- `tests/` 與 fixtures（見 §12）
- `package.json` 新增 script：`sync`（跑 `scripts/sync.ts`）、`test`（vitest）

刪除：

- `src/config/techConfig.ts`、`algoConfig.ts`、`travelConfig.ts`、`common.ts`
- `src/pages/Outline.tsx`、`Tech.tsx`、`Travel.tsx`、`Algorithm.tsx`
- `src/components/List.tsx`（由 `PostList` 取代，因為資料形狀改變）

保留並調整：

- `src/components/SubMenu.tsx` — 介面（items／activeItem／onItemClick）正好是 tag filter 需要的形狀，改由 URL searchParams 驅動而非 `useState`。
- `StickyHeader.tsx` 導覽指向新路由；`Section.tsx`、`Flex.tsx`、`Footer.tsx`、`theme.ts` 不變。
- `App.tsx` 路由改為 `/` 與 `/t/:topic`。
- `README.md` 修正部署與 SEO 描述，補 sync 流程說明。

新增依賴：

- `fast-xml-parser`（devDependency，只在 sync script 用，不進 bundle）。手刻正則解析 XML 不可接受。
- `vitest`（devDependency）。repo 目前沒有測試框架。

## 12. 測試策略

只測「會因規則錯誤而壞掉的可觀察行為」，全部針對 `scripts/sync.ts` 抽出的純函式：

1. **分類迴歸測試（最重要）**：**在刪除 `travelConfig.ts` 之前**，先把它的 55 筆人工分類抽成 `tests/fixtures/travel-type.json`（link → 住宿／景點／酒吧），斷言 `classifyTravelType` 55/55 命中且 0 誤判。日後有人動 pattern 或順序，這個測試會擋下來。實作順序因此固定：先抽 fixture ＋ 寫測試，再刪 config。
2. **normalize**：以實際抓下來的 feed fixture（各一份）斷言 Blogger entry 與 Medium item 轉出的 `Post` 欄位正確，含 `guid → id` 的推導。
3. **merge**：feed 缺少既有 id → 仍存在；同 id 重複 → 合併且 tags 聯集去重（對應 `/p/5bc7be208eac` 這個真實案例）。
4. **deriveTopic**：LeetCode／演算法標題 → `algo`；其餘 Medium → `tech`；Blogger → `travel`。

UI 不寫測試，改用 smoke 驗證（見 §13）。

## 13. 驗收標準

1. `yarn sync` 產出的 `data/posts.json`：唯一 id ≥ 205，其中 `source: 'blogger'` = 134、`source: 'medium'` ≥ 71。
2. Blogger 文章 100% 有 `date`、`image`、至少一個地名 tag、一個類型 tag。
3. `vitest` 全綠，含 55/55 分類迴歸。
4. `yarn dev` 後以瀏覽器實際確認：首頁列出最新 10 篇且日期遞減正確；`/t/travel?tag=日本` 直接開啟即帶著過濾狀態；點擊外連帶 utm 且不破壞既有 query；搜尋「京都」同時命中 Blogger 與（若有）Medium 文章。
5. GitHub Action 手動 `workflow_dispatch` 跑一次：無新文章時不產生 commit；有新文章時 commit `data/posts.json` 並完成部署。
6. repo 內不存在 `src/config/*Config.ts` 與舊四頁；`grep` 不到 `HashRouter`。

## 14. 風險與取捨

- **平台改版**是唯一真風險（Medium 關閉 RSS、Blogger 改 feed 格式）。緩解：資料 commit 進 repo＋append-only merge，最壞是停更而非資料消失；Action 紅燈即通知。
- **Medium 只有 10 篇視窗**：每日排程對你的發文頻率有極大餘裕（同日發第 11 篇才會漏）。
- **SEO 留在平台端**：選定「索引站」路線的必然結果。因此預算放在 OG 分享卡與「最新文章」，不做 SSR。
- **類型推導依賴標題慣例**：目前 100% 準確，但慣例是你自己維持的。降級鏈的 (c) 保證慣例改變時不掉資料，只是少一個 tag；補 Blogger label 可永久脫離對標題的依賴。

## 15. 明確排除、未來可選

- 地圖視圖（`geo` 已在 schema，133/134 有座標，本次不渲染）。
- 聚合 RSS 輸出。
- 新來源（YouTube、Substack）。schema 的 `source` 已是開放列舉，屆時只需加一個 fetcher。
- 全文搜尋（目前欄位比對對 205 筆足夠）。
