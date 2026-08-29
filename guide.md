# Guide

## 概念

這是一個把散落在不同平台的文章集中起來的索引站。文章來自各平台的 feed，經過分類後
以 tech / algo / travel 三個主題呈現，目的在於有一個集中的地方能依主題找到自己寫過
的東西。

feed 是唯一的事實來源：沒有任何一篇文章的標題或連結是手寫進 repo 的。

## 架構

/data

生成的文章索引。`posts.json` 由 `yarn sync` 寫出，是 app 唯一讀取的資料來源
（build 時 import，沒有 runtime fetch）。`seed.medium.json` 是 Medium RSS 已經
撈不到的舊文備份，只讀不寫。`overrides.json` 是唯一需要人工維護的檔案，用來補
feed 給不了的資訊（`addTags`、`topic`、`hidden`）。

`posts.json` 列在 `.prettierignore` 裡，不要對它跑 formatter。

/scripts

同步工具。`sync.ts` 是每日跑的那支：抓 feed → normalize → 分類 → 與 overrides
合併 → 寫回 `data/posts.json`；`lib/` 放各平台的 fetcher 與 normalizer，以及
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

```
feed → yarn sync → data/posts.json → 每日 Action commit + 部署 gh-pages
```

`yarn sync` 是 idempotent 的：來源沒變就寫出位元完全相同的檔案，所以 Action 只在
真的有變動時才 commit。feed 掛掉或回空時 fetcher 會 throw，job 紅燈且不會寫檔，
上一版 `posts.json` 自然保留。

要手動改分類或補標籤，改 `data/overrides.json`，跑 `yarn sync`，然後把兩個檔案
一起 commit。

## 部署

GitHub Pages，站點在 <https://sean1093.github.io/outline>。因為用的是
`BrowserRouter`，`predeploy` 會把 `dist/index.html` 複製成 `dist/404.html` 當
SPA fallback，少了它直接輸入 `/outline/t/travel` 會 404。
