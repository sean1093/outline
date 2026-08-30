# Outline 索引站 — 後續項目

來源：14 個任務的逐項審查 ＋ 一次全分支最終審查，共 42 個延後項目經過分級。
這份檔案只留下「日後真的可能想做」的部分；已判定為不可達或無實質影響的觀察沒有收錄。

實作日期 2026-08-29 / 08-30。

## 合併時實際踩到的一個陷阱

**`.worktrees/` 底下有 worktree 時，`yarn test` 會跑兩遍。** 合併驗證時測試數是 14 files / 126 tests，正好是 7 / 63 的兩倍——vitest 從 repo 根目錄 glob，預設的 exclude 只涵蓋 `node_modules`、`dist` 之類，不看 `.gitignore`，所以 `.worktrees/<branch>/tests/` 也被掃進去。移除 worktree 後立刻回到 7 / 63。

這次沒有造成誤判（兩份都是綠的），但下一個功能分支會再踩到，而且如果 worktree 裡的資料較舊，會出現「同一個測試同時綠與紅」這種難查的狀況。要根治就加一份 vitest 設定排除 `.worktrees/**`；在那之前，跑測試前先確認測試數是不是預期的。

## 需要你決定的四件事（不是缺陷）

**1. Pages 來源設定。** 第一次手動觸發 workflow **之前**，先確認 repo 的 GitHub Pages source 設為 `gh-pages` branch。若設成「GitHub Actions」，`peaceiris/actions-gh-pages` 會跑成功但畫面不會有任何變化。

**2. workflow 從未執行過。** yarn cache 還原、`persist-credentials`、實際的 `git push`、gh-pages 發佈這四件事到目前為止全都只是靜態驗證。第一次 `workflow_dispatch` 同時也是第一次部署。

**3. `fast-xml-parser@5.11.1` 的傳遞依賴。** 它帶進六個套件（`@nodable/entities`、`fast-xml-builder`、`is-unsafe`、`path-expression-matcher`、`xml-naming`、`anynum`）。全部經 registry 驗證屬於 fast-xml-parser 作者（NaturalIntelligence）名下，但其中五個首次發佈於 2026 年 2–6 月、單一維護者，而使用它的 job 持有 `contents: write`。lockfile 的 integrity pinning 加上 `--frozen-lockfile` 是正確的緩解，且已就位——這件事需要的是「知情地接受」而非修改。

**4. `yarn lint` 看不到格式問題。** `eslint-plugin-prettier` 與 `eslint-config-prettier` 是 devDependency 但從未接進 `eslint.config.js`。目前有 7 個被追蹤的檔案不符 prettier（`src/components/{Card,Footer,SubMenu}.tsx`、`src/index.css`、`src/styles/theme.ts`，以及兩份 docs），全部在本次分支開始前就已如此，本分支沒有新增任何一個。若要整理，做成一個單獨的 `prettier --write` commit，不要混進功能分支。

## 值得做，成本很低

- **`sync.ts` 的寫入不是原子的。** 寫到一半被中斷會留下截斷的 JSON。下一次執行會失敗關閉（`readJson` 拋錯、什麼都不寫），但磁碟上的檔案已經壞了，得靠 `git checkout` 救。修法：寫 `.tmp` 再 `renameSync`，同目錄下 POSIX 保證原子。
- **`App.tsx` 硬寫 `basename="/outline"`**，而 `vite.config.ts` 另外設 `base: '/outline/'`。同一個部署路徑有兩個來源，改一邊會靜默壞掉路由。用 `basename={import.meta.env.BASE_URL}` 讀 Vite 已經算好的值。
- **`data/seed.medium.json` 存的是 prettier 的位元組，不是產生器的。** 重跑那支一次性工具會產生約 1045 行純空白差異，蓋住真正的資料變動。把它也加進 `.prettierignore`（一行），理由與 `posts.json` 完全相同。
- **`Section.tsx` 有三個死掉的 inline `@media` key。** React 會靜默丟棄它們。注意：版面沒有壞——`index.css` 的 `.container` 已經提供 `max-width: 1200px`，1440px 實測是置中的 1088px 欄。這裡要做的只是刪掉三行死碼。
- **部署 action 用可變 tag。** `peaceiris/actions-gh-pages@v4` 在一個持有 `contents: write` 的 job 裡；要加固就 SHA-pin。
- **搜尋的 NFKC 全形折疊沒有測試。** 把 `.normalize('NFKC')` 刪掉整個測試套件仍然全綠。一個全形查詢的斷言就能守住。

## 已知限制（不是 bug，但會讓人意外）

**tag 只會累積，永遠不會減少。** `mergePosts` 在每次 id 碰撞時對 tags 做聯集，所以來源端刪掉或改名一個 Blogger label，舊 tag 不會從索引消失——那篇文章會同時出現在新舊兩個 tag 底下，而且重新 sync 也修不回來。

真正的解法是為 tag 加上來源標記（per-source provenance），那是 schema 變更，屬於另一件事。在那之前，修一個誤標只能手動編輯 `data/posts.json`，或把受影響的紀錄刪掉讓下一次 sync 重新加回來。`overrides.json` 的 `addTags` 同樣是單向的。

**`data/posts.json` 是累積的，不能砍掉重練。** 它同時是 sync 的輸入與輸出。詳細說明在 README 與 `guide.md`，這裡只是提醒：Medium 的 RSS 只回最新 10 篇，seed 凍結在 71 篇，兩者之間的那批文章只存在於這個檔案裡。

## 使用者體驗的小事

- `?lang=en` 時 facet chip 的數字仍然是中文語料的（例如「日本 (50)」上方最多只能列出 4 篇）。目前是刻意低估的行為，只影響 4 篇文章。
- 手打一個不存在的 `?place=xyz` 或空的 `?place=` 會顯示空清單，而 chip 卻顯示「全部地區」。站內沒有任何路徑會產生這種 URL。
- `og:image` 還沒有，所以分享卡片沒有圖。`public/favicon.svg` 不能當 OG 圖（SVG 不被接受），這需要真的做一張圖。
- README 的專案結構樹狀圖有一個字元用錯（`scripts/` 只有一個子項卻用 `├──`）。

## 測試覆蓋的已知缺口

都不影響現有行為，列出來是為了讓下一個人知道哪裡沒有網子：

- `places.test.ts` 沒有測到 `LANG_LABEL` 的排除（`normalize.test.ts` 在上一層有測）。
- `summarize` 的截斷只斷言長度 141，沒有釘住結尾的省略號與前 140 字。
- `latest` 沒有斷言排序——它的順序來自 artefact，所以在函式裡加一個 sort 也不會變紅。
- `placeFacets` 與 `tagFacets` 沒有被「換成原始陣列」的測試保護；每種 facet 各有一個代表被保護。
- 反空洞守衛依賴英文版那組文章持續涵蓋 `台灣` 與 `住宿`（餘裕 4/4/3）。若哪天不再涵蓋，測試會因資料變動而變紅——是安全方向的失敗。

## UX 修正後新發現的兩件事（2026-08-30）

**1. tech 的 tag 嚴重碎片化，這是內容端的問題。** 同一個「前端」概念被拆成 8 個 tag：`frontend`(17)、`前端`(11)、`front-end-development`(10)、`frontend-development`(3)、`前端筆記`(3)、`前端開發`(1)、`前端工程師`(1)、`front`(1)。tag chip 列只顯示前 20 名，所以這 47 篇被切碎後有幾個永遠排不進去。

修法只能在 Medium 端重新打 tag——`overrides.json` 的 `addTags` 只能加不能減，而移除需要 tag 來源標記那個 schema 變更。挑一個正規名稱（建議 `frontend`），把其餘的在 Medium 上改掉，下次 sync 後舊 tag 仍會留在索引裡（見上面的單調性限制），屆時要手動編輯 `data/posts.json` 一次。

**2. 深連結回 HTTP 404（但畫面正常）。** `https://sean1093.github.io/outline/t/travel` 的狀態碼是 404，內容卻是正確的 SPA shell，所以瀏覽器正常渲染、React Router 正常接手。這是 gh-pages 用 `404.html` 當 SPA fallback 的固有行為。

影響範圍限於「把狀態碼當真」的消費者：爬蟲、部分聊天軟體的連結預覽、連結檢查工具會把分享出去的分類頁當成不存在。真要修得改成 SSG（Astro/Next 靜態輸出）或換到會回 200 的 host（Cloudflare Pages / Netlify 的 SPA rewrite）。首頁 `/outline/` 本身回 200，不受影響。
