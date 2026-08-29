# Guide

## 概念

這是一個把散落在不同平台的文章集中起來的索引站。文章來自各平台的 feed，經過分類後
以 tech / algo / travel 三個主題呈現，目的在於有一個集中的地方能依主題找到自己寫過
的東西。

feed 是 metadata 的事實來源：沒有任何一篇文章的標題或連結是手寫進 repo 的。但
「有哪些文章」的事實來源是 committed 的 `data/posts.json`——索引是累積的，feed
撈不到的舊文只存在那裡。

## 架構

/data

累積下來的文章索引。`posts.json` 由 `yarn sync` 原地覆寫，同時也是 `yarn sync`
的輸入之一（見下面「資料怎麼更新」），是 app 唯一讀取的資料來源（build 時
import，沒有 runtime fetch）——**不能砍掉重練**。`seed.medium.json` 是 Medium RSS
已經撈不到的舊文備份，每次 sync 都會讀，只讀不寫。`overrides.json` 是唯一需要
人工維護的檔案，用來補 feed 給不了的資訊（`addTags`、`topic`、`hidden`）。

`posts.json` 列在 `.prettierignore` 裡，不要對它跑 formatter。

/scripts

同步工具。`sync.ts` 是每日跑的那支：抓 feed → normalize → 分類 → 與既有的
`posts.json`、`seed.medium.json` 及 `overrides.json` 合併 → 寫回
`data/posts.json`；`lib/` 放各平台的 fetcher 與 normalizer，以及
merge 邏輯。`backfill-medium.ts` 是一次性的歷史回填工具，不在日常流程裡，留著
只為記錄 `seed.medium.json` 是怎麼來的。

/src/lib

分類與選取器。`classify.ts` 是規則本體（主題判定、旅遊類型、國家與地點切分），
sync 腳本與前端共用同一份規則；`posts.ts` 是前端讀索引用的選取器（篩選、分面、
計數）；`url.ts` 加 utm 參數。

/src/pages

只有兩頁：`Home.tsx`（主題入口與搜尋）與 `Topic.tsx`（`/t/:topic`，帶 URL 驅動
的分面）。其餘路徑一律轉回 `/`。

/src/components

共用元件。`PostList` 與 `FacetRow` 是索引頁在用的，`Section`、`Card`、
`StickyHeader`、`SubMenu`、`Footer`、`Flex` 是版面元件。

## 資料怎麼更新

`yarn sync` 是**合併**進 `data/posts.json`，不是重新產生它：

```
Medium / Blogger feed ─┐
                       │
data/posts.json ───────┤   yarn sync
（上一版索引）          ├──▶  抓 feed → normalize → 分類
data/seed.medium.json ─┤     依 id 合併、套 overrides、排序
（凍結的歷史回填）      │
data/overrides.json ───┘
                                    │
                                    ▼
                          data/posts.json（原地覆寫）
                                    │
                                    ▼
                    每日 Action：有變動才 commit，然後部署 gh-pages
```

**不要為了「重新生成」而刪掉 `data/posts.json`。** `sync.ts` 會把它讀回來當
既有狀態（`scripts/sync.ts:29-32`），檔案不見就落到 `[]` fallback，下一次
sync 會安靜地生出一份**變少**的索引：Medium RSS 只給最新 10 篇，
`seed.medium.json` 只涵蓋凍結當時的 71 篇，中間那些「凍結之後發、又已經滑出
10 篇視窗」的文章只存在於 `posts.json` 裡，而這個集合會隨著每次發文變大。

合併以文章 id 為鍵，後來的來源逐欄位覆寫、tags 一律取聯集。所以 feed 負責更新
它還提供的那些文章的 metadata，`posts.json` 負責保住 feed 已經不提供的那些。

`yarn sync` 是 idempotent 的：來源沒變就寫出位元完全相同的檔案，所以 Action 只在
真的有變動時才 commit。feed 掛掉或回空時 fetcher 會 throw，job 紅燈且不會寫檔，
上一版 `posts.json` 自然保留。

要手動改分類或補標籤，改 `data/overrides.json`，跑 `yarn sync`，然後把兩個檔案
一起 commit。

## 部署

GitHub Pages，站點在 <https://sean1093.github.io/outline>。因為用的是
`BrowserRouter`，`predeploy` 會把 `dist/index.html` 複製成 `dist/404.html` 當
SPA fallback，少了它直接輸入 `/outline/t/travel` 會 404。
