# 🌟 ㄅㄆㄇㄈ 注音發音出題機 🌟

這是一個專為幼兒園、小學生設計的 **ㄅㄆㄇㄈ 注音符號發音出題機**。採用純前端網頁技術開發，具備童趣的視覺界面、即時合成的音效與背景音樂，以及語音發音輔助（TTS），非常適合家長、老師協助小朋友練習拼音與發音。

---

## 🎨 核心功能與特色

1. **五大關卡模式**：
   * **Lv.1 🌟 符號召喚師**：認讀 37 個基礎符號，固定為一聲，不帶聲調干擾。
   * **Lv.2 ⚔️ 雙音雙打組**：兩拼組合（聲母+韻母，或介音+韻母），隨機帶有五種聲調變化。
   * **Lv.3 🏰 三音大合奏**：三拼組合（聲母+介音+韻母），隨機帶有五種聲調變化。
   * **Lv.4 🏆 終極解碼王**：兩拼與三拼隨機混合出題。
   * **♾️ 無限挑戰賽**：不限制題數的無盡模式，題目動態生成，直到 3 顆心扣完或手動退出為止。

2. **零資源加載與高品質音效**：
   * **音效與音樂**：使用 **Web Audio API** 即時合成「叮咚」與「benben」音效，並搭載紅白機 (NES) 風格的 8-bit 童趣背景音樂（BGM）。不需額外加載 MP3 音檔，速度極快且絕不失效。
   * **語音輔助 (TTS)**：使用 **Web Speech API** (`SpeechSynthesis`) 進行台灣口音 (`zh-TW`) 語音合成。支援點擊「聽正確發音」按鈕為題目或注音表進行發音教學。

3. **不存在拼音過濾**：
   * 內建例外黑名單（如 `ㄅㄧㄚ`、`ㄋㄧㄚ`、`ㄔㄨㄚ` 等現實中罕見或不存在之音），系統在隨機出題時會自動過濾，確保小朋友只學習到實用、正確的中文拼音。

4. **數據儲存與設定**：
   * 內建排行榜功能，記錄玩家姓名、得分、日期，且支援「混合排行」與「依關卡分類」之頁籤切換。
   * 排行榜紀錄與音效/音樂音量設定均透過 `localStorage` 儲存於瀏覽器本地端，重新整理或關閉裝置資料亦不會遺失。

5. **跨裝置響應式與電視 (Android TV) 遙控器支援**：
   * 支援 PC、iPad/Android 平板及 Android TV 瀏覽器。
   * 設有顯眼的 Focus 高亮提示框，完美支援鍵盤 Tab 與電視遙控器選取。
   * **家長評判快捷鍵**：
     * **答對 ⭕**：鍵盤按下 `O`、`Enter` 或 `Space`。
     * **答錯 ❌**：鍵盤按下 `X`、`Esc` 或 `Backspace`。
     * **重聽 🔊**：鍵盤按下 `S`、`V` 或 `P`。

---

## 🚀 部署與執行方式

本專案為 **純前端靜態網頁 (Pure Client-side Web App)**，**無任何後端伺服器 (Serverless)**，相容性極高，可以直接在任何瀏覽器中開箱即玩：

1. **本地執行**：下載專案後，直接雙擊雙點 **[index.html](file:///home/kenny/Git_KennySpace/Learn_Bopomofo/index.html)** 檔案即可在瀏覽器打開遊玩。
2. **靜態網頁託管**：可一鍵將此資料夾拖放至 GitHub Pages、Vercel、Netlify 或 Surge 等免費託管平台，即可在平板、智慧電視或手機上透過網址開啟。
3. **PWA 安裝**：未來可配置 manifest 直接「安裝」至 iPad 或 TV 桌面上進行完全離線遊玩。

---

## 🛠️ 專案架構

```bash
Learn_Bopomofo/
├── index.html            # 主頁面與骨架
├── Requirement.md        # 原創需求文件
├── implementation_plan.md # 開發與進度管理計畫書
├── css/
│   └── style.css         # 設計系統、馬卡龍配色與 RWD 樣式
└── js/
    ├── app.js            # 遊戲核心邏輯、TTS 語音與頁面控制
    ├── audio_synth.js    # Web Audio API 聲音合成管理器
    └── bopomofo_data.js  # 37注音符號表、合法拼音庫與黑名單
```

---

## 🤖 AI 智能代理開發指南 (Developer Guide for AI Agents)

本專案的程式碼、邏輯設計與測試，皆是採用 **AI 智能代理 (AI Agentic Coding)** 完成開發。

如果您希望繼續擴充本專案、除錯或新增功能，**強烈建議使用 Antigravity、Claude (帶 MCP 工具) 或 GitHub Copilot Workspace 等具備自主代理能力 (Agentic) 的開發助手**。

### 📌 代理開發流程指引：
1. **閱讀計畫**：在開始變更代碼前，請務必先閱讀專案根目錄下的 **[implementation_plan.md](file:///home/kenny/Git_KennySpace/Learn_Bopomofo/implementation_plan.md)**。
2. **分解任務**：若有新需求（例如：接入家庭同步碼雲端同步、新增成就徽章系統等），請在 [implementation_plan.md](file:///home/kenny/Git_KennySpace/Learn_Bopomofo/implementation_plan.md) 中建立新的階段（如 `階段五`），並明確拆解出各個步驟。
3. **單步執行與 Commit**：請秉持「每完成一個步驟就進行一次 Git Commit」的原則，確保程式碼變更小、易於審查，且擁有極高可讀性的 Commit History。
4. **保持文件同步**：在完成新功能提交後，記得將計畫書中對應步驟的 `[ ]` 勾選為 `[x]`，並填入實際的 Commit 哈希值或說明。
