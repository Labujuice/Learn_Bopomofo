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

### 🔄 階段二：需求精進與調整 (進行中)

* [ ] **步驟 9：移除 Level 1 聲調限制**
  * **需求變更**：Level 1（基礎 37 符號認讀）不應該帶有聲調（固定為一聲，不標註聲調符號）。
  * **調整範圍**：`js/app.js` 的 `generateQuestionList` 出題邏輯。
  * **預期 Commit**: `refactor: remove tones from Level 1 questions`

* [ ] **步驟 10：關閉出題時的自動語音發音**
  * **需求變更**：出題時不應自動播放 TTS 朗讀題目給小朋友，必須由主持人（家長/老師）手動點擊「聽正確發音」按鈕或按下快捷鍵時才播放。
  * **調整範圍**：`js/app.js` 中的 `loadQuestion` 函式。
  * **預期 Commit**: `refactor: disable automatic TTS pronunciation on question load`

* [ ] **步驟 11：黑名單例外管理（過濾罕見與不存在拼音）**
  * **需求變更**：過濾現實中不存在或極罕見的注音拼合組合（如 `ㄅㄧㄚ`、`ㄋㄧㄚ`、`ㄔㄨㄚ` 等）。
  * **調整範圍**：
    1. 在 `js/bopomofo_data.js` 中建立 `BOPOMOFO_BLACKLIST` 黑名單陣列。
    2. 在 `js/app.js` 中新增過濾機制，若隨機產生的拼音存在於黑名單中，則自動重新抽題。
  * **預期 Commit**: `feat: add bopomofo blacklist to filter rare and non-existent combinations`
