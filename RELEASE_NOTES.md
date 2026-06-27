# 📋 Release Notes — ㄅㄆㄇㄈ 注音發音出題機

> 版本歷史依時間倒序排列，最新版本在最上方。

---

## v2.1.0 — 發音精調（2026-06-27）

**Branch:** `optimize_pronunciation`

### 🔧 Bug Fixes

#### 聲母單音發音修正（Level 1）

| 符號 | 問題 | 修正方式 |
|------|------|---------|
| ㄓ | Google TTS 讀出帶「一」尾音的雜音 | 改用漢字錨點「**知**」(zhī) |
| ㄔ | 同上 | 改用「**吃**」(chī) |
| ㄕ | 同上 | 改用「**師**」(shī) |
| ㄖ | 讀成「而」(ér)，不像捲舌音 | 改用「**日**」(rì)，最接近英文 r 的捲舌音 |
| ㄗ | 帶「一」尾音 | 改用「**資**」(zī) |
| ㄘ | 帶「一」尾音 | 改用「**疵**」(cī) |
| ㄙ | 帶「一」尾音 | 改用「**司**」(sī) |

> ㄅㄆㄇㄈ 保持原有的 bo/po/mo/fo 讀法（符合台灣小學注音教學習慣）。

### 📝 Commits
- `5f63c21` — fix: correct single-symbol pronunciation for ㄅㄆㄇㄈ and ㄓㄔㄕㄖㄗㄘㄙ
- `ab647c0` — revert: restore ㄅㄆㄇㄈ audio to original (bo/po/mo/fo pronunciation)
- `e7bb99e` — fix: ㄖ pronunciation changed from 而(ér) to 日ˉ(rī first tone)
- `197dff4` — fix: ㄖ use 日(rì) natural 4th tone for closest English-r quality

---

## v2.0.0 — 跨平台發音一致性（2026-06-27）

**Branch:** `optimize_pronunciation`

### 🚀 Major Feature: TTS Engine v2.0

#### 問題背景
Web Speech API 依賴各裝置的本地 TTS 引擎，導致：
- iOS Safari、Android Chrome、Windows Chrome、macOS 播放出來的台灣口音完全不同
- 部分平台無 zh-TW 語音，自動降級成大陸口音甚至英文
- 不同版本的 OS 對注音符號解讀不一致，出現奇怪的讀法

#### 解決方案：預錄靜態音檔

| 項目 | 舊架構 | 新架構 |
|------|--------|--------|
| 發音來源 | Web Speech API（各平台本地引擎） | Google Translate TTS zh-TW 預錄 MP3 |
| 跨平台一致性 | ❌ 每個裝置聲音不同 | ✅ 所有裝置播放同一音檔 |
| 台灣口音 | ⚠️ 依裝置而定 | ✅ 固定使用 Google zh-TW 台灣口音 |
| 網路依賴 | ❌ 部分平台需連線才有語音 | ✅ 音檔靜態部署，完全離線可用 |
| 音檔數量 | N/A | 1,877 個 MP3（37符號 + 全部拼音組合×5聲調）|
| 總大小 | 0 MB | 約 19 MB |

#### 雙層發音架構（`js/tts_engine.js`）
```
Layer 1（優先）: 靜態 MP3 音檔
  → audio/{unicode-hex}_{tone}.mp3
  → 100% 跨平台一致，台灣 Google TTS 口音
  → 支援 iOS 音訊解鎖 (prime())

Layer 2（備援）: Web Speech API
  → 僅在音檔不存在時自動 fallback
  → 保持原有的 zh-TW 優先選音邏輯
```

#### 音檔命名規則
音檔以注音符號的 Unicode 碼點 Hex 命名，確保跨平台安全：
```
ㄅ       → audio/3105.mp3
ㄅㄚ一聲  → audio/3105_311A_tone1.mp3
ㄅㄧㄢ二聲 → audio/3105_3127_3122_tone2.mp3
```

### 📁 新增檔案
- `js/tts_engine.js` — 跨平台 TTS 引擎類別
- `audio/manifest.json` — 音檔索引（1,877 條目）
- `audio/*.mp3` — 1,877 個預錄音檔
- `scripts/generate_audio.js` — 批量下載腳本
- `scripts/fix_initials_audio.js` — 聲母修正腳本

### 📝 Commits
- `fe2d441` — feat: replace Web Speech API with pre-generated static audio for cross-platform consistency

---

## v1.x — 初始開發階段

**Branch:** `main` / `Fix_voice`

### v1.5 — 語音 Bug 修正（Fix_voice branch）
- 修正 ㄖ 讀成「日一」的 Bug，改為對應字「日」
- 修正聲母發音時誤讀聲調名稱（「唸幾聲」）的問題
- 修正介音/韻母（如 ㄛ）的特殊字對應（→「噢」）
- 修正 iOS Safari TTS 佇列堵塞與靜音問題

### v1.4 — 聽音選選看模式
- 新增「👂 聽音選選看」遊戲模式
- 聽音模式自動播放題目音訊，提供 4 選 1 注音選項
- 選項顯示時同步渲染聲調符號

### v1.3 — 遙控器與鍵盤快捷鍵
- 新增 Android TV 遙控器 Focus 支援
- 鍵盤快捷鍵：`O/Enter/Space`（答對）、`X/Esc/Backspace`（答錯）、`S/V/P`（重聽）

### v1.2 — 無限挑戰模式
- 新增 ♾️ 無限挑戰題數選項
- 動態生成題目，直到生命值歸零

### v1.1 — 排行榜與設定
- 新增排行榜系統（localStorage 儲存）
- 排行榜支援混合排行與依關卡分類頁籤
- 新增音量設定滑桿（BGM / SFX 獨立控制）

### v1.0 — 初始版本
- 37 個注音符號完整出題系統
- Lv.1 ~ Lv.4 四個遊戲關卡
- 2 種遊戲模式：說音模式 / 聽音模式
- Web Speech API TTS 語音輔助
- Web Audio API 即時合成音效 + NES 風格 BGM
- 合法拼音資料庫與黑名單過濾
- 隨機水果名稱產生器
- 響應式設計（手機 / 平板 / 電視）

---

*由 [Google Antigravity AI](https://deepmind.google/antigravity/) 協助開發與維護。*
