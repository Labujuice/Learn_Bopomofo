# 🌟 ㄅㄆㄇㄈ 注音發音出題機 🌟

🔗 **線上遊玩網址：[https://labujuice.github.io/Learn_Bopomofo/](https://labujuice.github.io/Learn_Bopomofo/)**

這是一個專為幼兒園、小學生設計的 **ㄅㄆㄇㄈ 注音符號發音出題機**。採用純前端網頁技術開發，具備童趣的視覺界面、即時合成的音效與背景音樂，以及**高品質預錄台灣口音語音發音**，非常適合家長、老師協助小朋友練習拼音與發音。

---

## 🎨 核心功能與特色

1. **五大關卡模式**：
   * **Lv.1 🌟 符號召喚師**：認讀 37 個基礎符號，固定為一聲，不帶聲調干擾。
   * **Lv.2 ⚔️ 雙音雙打組**：兩拼組合（聲母+韻母，或介音+韻母），隨機帶有五種聲調變化。
   * **Lv.3 🏰 三音大合奏**：三拼組合（聲母+介音+韻母），隨機帶有五種聲調變化。
   * **Lv.4 🏆 終極解碼王**：兩拼與三拼隨機混合出題。
   * **♾️ 無限挑戰賽**：不限制題數的無盡模式，題目動態生成，直到 3 顆心扣完或手動退出為止。

2. **兩種遊戲模式**：
   * **🗣️ 看字說說看（說音模式）**：顯示注音題目，由小朋友唸出正確讀音，家長按圈圈/叉叉評判。
   * **👂 聽音選選看（聽音模式）**：播放注音讀音，小朋友從 4 個選項中選出正確的注音符號。

3. **🔊 跨平台一致的高品質發音系統（v2.0）**：
   * 預先使用 **Google Translate TTS（zh-TW 台灣口音）** 生成 **1,877 個高品質 MP3 音檔**，涵蓋全部 37 個符號與所有合法拼音組合的五種聲調。
   * 採用**雙層發音架構**：優先播放靜態音檔（所有平台完全一致），若音檔不存在則自動降級至 Web Speech API。
   * 完全解決了不同裝置（iOS / Android / PC / TV）使用系統 TTS 造成的發音不一致問題。
   * 各聲母單音發音符合台灣注音教學標準：ㄓ→知、ㄔ→吃、ㄕ→師、ㄖ→日、ㄗ→資、ㄘ→疵、ㄙ→司。

4. **零資源加載的即時音效**：
   * 使用 **Web Audio API** 即時合成「叮咚（答對）」與「benben（答錯）」音效，並搭載紅白機 (NES) 風格的 8-bit 童趣背景音樂（BGM）。

5. **不存在拼音過濾**：
   * 內建例外黑名單（如 `ㄅㄧㄚ`、`ㄋㄧㄚ`、`ㄔㄨㄚ` 等現實中罕見或不存在之音），系統在隨機出題時會自動過濾。

6. **數據儲存與設定**：
   * 內建排行榜，記錄玩家姓名、得分、日期，支援「混合排行」與「依關卡分類」頁籤切換。
   * 排行榜紀錄與音效/音樂音量設定均透過 `localStorage` 儲存於瀏覽器本地端。

7. **跨裝置響應式與電視 (Android TV) 遙控器支援**：
   * 支援 PC、iPad/Android 平板及 Android TV 瀏覽器。
   * **家長評判快捷鍵**：
     * **答對 ⭕**：鍵盤 `O`、`Enter` 或 `Space`
     * **答錯 ❌**：鍵盤 `X`、`Esc` 或 `Backspace`
     * **重聽 🔊**：鍵盤 `S`、`V` 或 `P`

---

## 🚀 部署與執行方式

本專案為 **純前端靜態網頁 (Pure Client-side Web App)**，**無任何後端伺服器 (Serverless)**，可直接在任何瀏覽器中開箱即玩：

1. **本地執行**：下載專案後，直接雙擊 **`index.html`** 檔案即可在瀏覽器打開遊玩。
2. **靜態網頁託管**：可一鍵將此資料夾推上 GitHub Pages、Vercel、Netlify 等免費託管平台。
3. **PWA 安裝**：可配置 manifest 直接「安裝」至 iPad 或 TV 桌面上進行完全離線遊玩。

---

## 🛠️ 專案架構

```bash
Learn_Bopomofo/
├── index.html              # 主頁面與骨架
├── Requirement.md          # 原創需求文件
├── implementation_plan.md  # 開發與進度管理計畫書
├── RELEASE_NOTES.md        # 版本發布記錄
├── css/
│   └── style.css           # 設計系統、馬卡龍配色與 RWD 樣式
├── js/
│   ├── app.js              # 遊戲核心邏輯與頁面控制
│   ├── tts_engine.js       # TTS 引擎 v2.0（靜態音檔 + Web Speech API 備援）
│   ├── audio_synth.js      # Web Audio API 聲音合成管理器（音效 & BGM）
│   └── bopomofo_data.js    # 37注音符號表、合法拼音庫與黑名單
├── audio/
│   ├── manifest.json       # 音檔索引（供前端快速查詢）
│   └── *.mp3               # 1,877 個預錄注音音檔（Google TTS zh-TW）
└── scripts/
    ├── generate_audio.js   # 批量下載全部音檔的 Node.js 腳本
    └── fix_initials_audio.js # 修正特定聲母發音的補丁腳本
```

---

## 📱 跨裝置執行與託管詳細指南 (iPad & Android TV 部署)

### 🌐 第一步：託管網頁 (取得網頁網址)
1. **GitHub Pages (最推薦)**：
   * 將此專案推送至 GitHub，前往 Settings → Pages，選擇 `main` 分支並儲存。
   * 本專案的線上遊玩網址：[https://labujuice.github.io/Learn_Bopomofo/](https://labujuice.github.io/Learn_Bopomofo/)
2. **Vercel / Netlify (零門檻拖放)**：直接將專案資料夾拖放至託管介面即可。
3. **區域網路臨時架設**：執行 `npx serve` 或 `python -m http.server 8080`，同 Wi-Fi 下的裝置輸入電腦 IP 即可開啟。

### 🍎 iPad 操作步驟
1. 使用 Safari 開啟網頁網址。
2. 點擊右上角「分享」→「加入主畫面 (Add to Home Screen)」。
3. iPad 桌面出現 App 圖示，點開後以全螢幕 PWA 模式執行。

### 📺 Android TV 操作步驟
1. 在 Google Play 下載 **TV Bro** 或 **Puffin TV Browser**。
2. 開啟網頁網址並加入書籤。
3. 遙控器 D-pad 選擇關卡，確認鍵開始，游標點「⭕/❌」評判。

---

## 🤖 AI 智能代理開發指南

本專案的程式碼、邏輯設計與測試，皆是採用 **AI 智能代理 (AI Agentic Coding)** 完成開發（使用 [Google Antigravity](https://deepmind.google/antigravity/)）。

### 📌 代理開發流程指引：
1. **閱讀計畫**：在開始變更代碼前，請先閱讀 **`implementation_plan.md`**。
2. **分解任務**：有新需求時，在計畫書中建立新的階段，明確拆解步驟。
3. **單步執行與 Commit**：每完成一個步驟就進行一次 Git Commit，確保變更小、易審查。
4. **保持文件同步**：完成功能後，同步更新計畫書的勾選狀態與 Commit 哈希值。

### 🔊 重新生成音檔（如需更新）
如果需要重新下載所有音檔（例如更新 TTS 來源）：
```bash
node scripts/generate_audio.js
```
如果只需修正特定聲母的發音：
```bash
node scripts/fix_initials_audio.js
```
