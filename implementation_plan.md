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
