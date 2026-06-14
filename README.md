# 🌟 ㄅㄆㄇㄈ 注音發音出題機 🌟

🔗 **線上遊玩網址：[https://labujuice.github.io/Learn_Bopomofo/](https://labujuice.github.io/Learn_Bopomofo/)**

這是一個專為幼兒園、小學生設計的 **ㄅㄆㄇㄈ 注音符號發音出題機**。採用純前端網頁技術開發，具備童趣的視覺界面，即時合成的音效與背景音樂，以及語音發音輔助（TTS），非常適合家長、老師協助小朋友練習拼音與發音。

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

## 📱 跨裝置執行與託管詳細指南 (iPad & Android TV 部署)

由於平板與智慧電視無法像 PC 一樣直接雙擊打開本地 HTML 檔案，最推薦的做法是**將本專案發布為網頁連結 (URL)**，再由各裝置開啟。

### 🌐 第一步：託管網頁 (取得網頁網址)
請選擇以下任一免費且快速的方式將專案放上網路：
1. **GitHub Pages (最推薦)**：
   * 將此專案推送至您的 GitHub 儲存庫。
   * 前往 Settings -> Pages，選擇 `main` 分支並儲存，本專案的線上遊玩網址為：[https://labujuice.github.io/Learn_Bopomofo/](https://labujuice.github.io/Learn_Bopomofo/)。
2. **Vercel / Netlify (零門檻拖放)**：
   * 註冊免費的 [Vercel](https://vercel.com/) 或 [Netlify](https://www.netlify.com/) 帳號。
   * 直接將本專案的資料夾拖放到託管介面中，即可立即生成一個隨機網址。
3. **區域網路臨時架設 (內網遊玩，免傳雲端)**：
   * 在您的 PC 電腦上開啟終端機，執行 `npx serve`（需安裝 Node.js）或 Python 命令 `python -m http.server 8080`。
   * 同網域（Wi-Fi）下的 iPad 或 Android TV 瀏覽器輸入電腦的區域網路 IP（例如 `http://192.168.1.100:8080`）即可開啟。

---

### 🍎 iPad 的具體操作步驟
1. 使用 iPad 的 **Safari 瀏覽器** 開啟您託管的網頁網址。
2. 點擊 Safari 右上角的 **「分享」按鈕**（向上箭頭的圖示）。
3. 在選單中選擇 **「加入主畫面」 (Add to Home Screen)**。
4. 輸入 App 名稱（例如「注音出題機」）並點擊新增。
5. **成果**：iPad 桌面上會出現一個獨立的 App 圖示。點開後會以 **全螢幕模式 (PWA)** 執行，隱藏網址列，且音效與本地排行榜紀錄將永久儲存在該 iPad 中。

---

### 📺 Android TV 的具體操作步驟
由於智慧電視鍵盤輸入不便，我們為此優化了操作體驗：

#### 方案一：使用 TV 專用瀏覽器 (最快最單純)
1. 在 Android TV 的 Google Play 商店中下載專為電視設計的瀏覽器，推薦 **TV Bro**（開源、完全免費且支援遙控器滑鼠模擬）或 **Puffin TV Browser**。
2. 使用瀏覽器輸入您的網頁網址。
3. **重要操作**：
   * 將網頁網址**加入書籤**，方便以後一鍵開啟。
   * 將瀏覽器設定為**「全螢幕/簡潔模式」**以獲得最佳視覺。
4. **遙控器操作**：我們已實作 Focus 亮顯，您可以直接用遙控器的**上下左右 (D-pad) 選擇題數與關卡**，按下 **確認鍵 (OK)** 即可開始。評判時，遙控器游標移至「⭕ 答對」或「❌ 答錯」按一下即可。

#### 方案二：包裝成 Android APK 安裝 (原生體驗)
如果您希望它像愛奇藝或 YouTube 一樣，直接出現在 Android TV 的 App 列表中：
1. 本專案為純網頁，您可以使用 **Capacitor** 或 **Cordova** 將專案打包。
2. 或者在 Android Studio 中新建一個簡單的電視專案，使用 `WebView` 載入您的託管網址，或將專案放入 `assets` 資料夾中進行本地載入。
3. 編譯生成 `.apk` 檔案後，放入隨身碟插上電視，使用電視上的檔案管理器進行安裝即可。

---

## 🤖 AI 智能代理開發指南 (Developer Guide for AI Agents)

本專案的程式碼、邏輯設計與測試，皆是採用 **AI 智能代理 (AI Agentic Coding)** 完成開發。

如果您希望繼續擴充本專案、除錯或新增功能，**強烈建議使用 Antigravity、Claude (帶 MCP 工具) 或 GitHub Copilot Workspace 等具備自主代理能力 (Agentic) 的開發助手**。

### 📌 代理開發流程指引：
1. **閱讀計畫**：在開始變更代碼前，請務必先閱讀專案根目錄下的 **[implementation_plan.md](file:///home/kenny/Git_KennySpace/Learn_Bopomofo/implementation_plan.md)**。
2. **分解任務**：若有新需求（例如：接入家庭同步碼雲端同步、新增成就徽章系統等），請在 [implementation_plan.md](file:///home/kenny/Git_KennySpace/Learn_Bopomofo/implementation_plan.md) 中建立新的階段（如 `階段五`），並明確拆解出各個步驟。
3. **單步執行與 Commit**：請秉持「每完成一個步驟就進行一次 Git Commit」的原則，確保程式碼變更小、易於審查，且擁有極高可讀性的 Commit History。
4. **保持文件同步**：在完成新功能提交後，記得將計畫書中對應步驟的 `[ ]` 勾選為 `[x]`，並填入實際的 Commit 哈希值或說明。
