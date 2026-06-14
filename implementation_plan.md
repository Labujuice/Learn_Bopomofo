# ㄅㄆㄇㄈ 發音出題機 - 開發與管理計畫書

本文件為本專案的開發管理計畫。後續所有新增需求與調整，均需在此更新並進行階段性 Git Commit。

---

## 📊 開發進度與 Commit 紀錄

### 🛠️ 階段一：基礎功能開發 (已完成)
* [x] **步驟 1：專案檔案結構初始化與注音字典庫**
  * Git Commit: `feat: initialize project structure and add legal bopomofo database`
* [x] **步驟 2：撰寫 HTML 結構與頁面切換機制**
  * Git Commit: `feat: implement game HTML structure and page routing`
* [x] **步驟 3：CSS 童趣視覺設計與微動畫**
  * Git Commit: `feat: design modern kid-friendly UI styling with CSS variables`
* [x] **步驟 4：Web Audio API 音效與背景音樂合成**
  * Git Commit: `feat: add procedural sound effects and background music using Web Audio API`
* [x] **步驟 5：Web Speech API 語音發音與出題生成器**
  * Git Commit: `feat: implement legal Bopomofo question generator and TTS helper`
* [x] **步驟 6：遊戲核心流程邏輯**
  * Git Commit: `feat: implement core gameplay loop, scoring, and animation feedback`
* [x] **步驟 7：注音符號表、排行榜與設定儲存**
  * Git Commit: `feat: add interactive symbol table, leaderboard, settings, and localstorage sync`
* [x] **步驟 8：電視 TV 遙控器/鍵盤操作優化與細節調整**
  * Git Commit: `feat: optimize responsive layout for TV/Tablet and add final polish`

---

### 🔄 階段二：需求精進與調整 (已完成)

* [x] **步驟 9：移除 Level 1 聲調限制**
  * Git Commit: `refactor: remove tones from Level 1 questions`

* [x] **步驟 10：關閉出題時的自動語音發音**
  * Git Commit: `refactor: disable automatic TTS pronunciation on question load`

* [x] **步驟 11：黑名單例外管理（過濾罕見與不存在拼音）**
  * Git Commit: `feat: add bopomofo blacklist to filter rare and non-existent combinations`

---

### 🔄 階段三：題數選擇與強退結算 (已完成)

* [x] **步驟 12：主畫面新增 10/20/30 題數選擇**
  * Git Commit: `feat: support selectable question counts (10/20/30 questions)`

* [x] **步驟 13：遊戲中途退出與立即結算**
  * Git Commit: `feat: support force-exit during game with immediate settlement`

---

### 🔄 階段四：無限挑戰賽 (已完成)

* [x] **步驟 14：新增「無限挑戰」模式**
  * Git Commit: `feat: add Infinite Challenge mode with on-the-fly question generation`

---

### 🔄 階段五：聽音選字模式（聽力練習） (已完成)

* [x] **步驟 15：主畫面新增「說 / 聽」模式切換 UI**
  * **需求變更**：主畫面新增「遊戲模式」選單，可切換「🗣️ 看字說說看」與「👂 聽音選選看」。
  * **調整範圍**：
    1. 修改 `index.html`，在姓名輸入下方新增模式切換的 Toggle/Tabs。
    2. 修改 `css/style.css`，加入模式切換的樣式。
  * **預期 Commit**: `feat: add Speak/Listen mode toggle to Main Menu UI`

* [x] **步驟 16：實作聽音選字（聽力模式）之選項生成與 RWD 佈局**
  * **需求變更**：當選擇「聽」模式時，隱藏底部的 ⭕/❌ 評判按鈕。中間出題區顯示一個大喇叭/耳朵按鈕（用來重聽），並在下方顯示 4 個隨機注音選項卡片（包含一個正確答案與三個隨機干擾項）。
  * **調整範圍**：
    1. 修改 `index.html`，在出題區加入選項容器。
    2. 修改 `css/style.css`，新增 4 個選項卡片的排版與選取樣式（相容 TV 遙控器與手機）。
  * **預期 Commit**: `feat: implement distractor generator and options layout for Listen Mode`

* [x] **步驟 17：實作聽音模式的自動播放、答題判定與核心循環**
  * **需求變更**：進入關卡或加載題目時，系統自動播放目標注音語音。點擊 4 個選項之一，系統自動判定是否正確並給予 ⭕/❌ 視覺回饋，正確則加分，錯誤則扣心，然後進入下一題。
  * **調整範圍**：修改 `js/app.js` 中的遊戲啟動、載入題目、選項點擊處理與音效播放邏輯。
  * **預期 Commit**: `feat: integrate Listen Mode gameplay loop and automatic judgment`

* [x] **步驟 18：修復 iOS/行動裝置語音與聽音模式下聲調與單字發音不符之問題**
  * **需求變更**：
    1. 解鎖並預熱 iOS/行動端網頁 TTS 引擎，並在 `cancel()` 與 `speak()` 之間引入延遲防止佇列堵塞。
    2. 聲母部分：只唸聲母本體發音，將其映射為注音符號本身（如 `ㄅ` 唸 `ㄅ`，`ㄉ` 唸 `ㄉ`），語音引擎會自然發出乾淨短促的聲母清音（如 `ㄅㄜ`、`ㄉㄜ`），絕對不加註「唸一聲」或「唸幾聲」字眼，且切勿寫作 `ㄅㄜ`、`ㄆㄜ` 等非法漢字拼音以免卡死語音引擎。
    3. 韻母、介音及組合拼音部分：正常加上聲調朗讀（如 `ㄚˊ`、`ㄨㄛˊ` 等），而一聲（如 `ㄚ`、`ㄨㄛ`）因沒有聲調符號，語音引擎會自然發出平聲，且不會多唸出「一聲」或「幾聲」字眼。
    4. 實作單音注音符號至清晰中文字對應表（如將 `ㄛ` 對應至 `噢`），避免 TTS 引擎將 standalone `ㄛ` 誤唸為 `ㄨㄛ` 導致發音與選項不符。
  * **調整範圍**：修改 `js/app.js` 中的 `speakBopomofo`，加入 `symbolPronunciationMap` 與 `gameState.gameMode` 判斷分支；更新 `js/audio_synth.js` 以便在 suspended 時自動喚醒音訊。
  * **預期 Commit**: `fix: resolve Web Speech API silencing and queue hanging on iOS and mobile browsers`、`fix: correct single symbol pronunciations and strip tone names in Listen Mode`、`fix: only read the pure sound of initials without tone names, keep tones for finals` 和 `fix: map initials to raw Bopomofo symbols for clean consonant sound readings`
