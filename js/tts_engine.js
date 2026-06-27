/**
 * ㄅㄆㄇㄈ 發音引擎 v2.0 - 跨平台一致性解決方案
 *
 * 架構：
 *   Layer 1 (優先) - 靜態音檔播放 (100% 一致，來自預先生成的 MP3)
 *   Layer 2 (備援) - Web Speech API (各平台有差異，僅在音檔缺失時使用)
 *
 * 音檔命名規則：使用注音字元的 Unicode 碼點 Hex 串
 *   單音：例如 ㄅ(U+3105) => "3105.mp3"
 *   組合音+聲調：例如 ㄅㄚ一聲 => "3105_311A_tone1.mp3"
 */

class BopomofoTTSEngine {
  constructor() {
    /** 音檔目錄（相對於 HTML 所在位置）*/
    this.audioDir = 'audio/';

    /** 音量 (0.0 ~ 1.0)，由外部 AudioManager 設定 */
    this.volume = 0.8;

    /** 播放速率（1.0 = 正常速度，0.8 = 稍慢，適合學習）*/
    this.playbackRate = 0.85;

    /** 當前播放中的 HTMLAudioElement */
    this._currentAudio = null;

    /** Web Speech API 語音列表（備援用）*/
    this._webSpeechVoices = [];
    this._webSpeechReady = false;

    /** 已確認存在的音檔 cache（避免重複 404 請求）*/
    this._existingFiles = new Set();

    /** 已確認不存在的音檔 cache */
    this._missingFiles = new Set();

    // 初始化 Web Speech API 備援
    this._initWebSpeech();

    // 預載 manifest（知道哪些音檔存在）
    this._loadManifest();
  }

  // ─── 初始化 ───────────────────────────────────────────────────────────────

  /** 初始化 Web Speech API 備援層 */
  _initWebSpeech() {
    if (typeof speechSynthesis === 'undefined') return;

    const loadVoices = () => {
      this._webSpeechVoices = speechSynthesis.getVoices();
      this._webSpeechReady = true;
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /** 從 manifest.json 預載可用音檔清單 */
  async _loadManifest() {
    try {
      const res = await fetch(this.audioDir + 'manifest.json');
      if (!res.ok) return;
      const manifest = await res.json();
      // manifest 的 key 是「文字」，value 是「路徑」
      for (const key of Object.keys(manifest)) {
        this._existingFiles.add(manifest[key]);
      }
      console.log(`[TTS Engine] manifest 載入完成，共 ${this._existingFiles.size} 個音檔`);
    } catch (e) {
      console.warn('[TTS Engine] 無法載入 manifest.json，將逐一嘗試音檔請求');
    }
  }

  // ─── 核心工具：檔名生成 ──────────────────────────────────────────────────

  /**
   * 將注音字串轉成音檔路徑
   * @param {string} syllable - 注音字串（如 "ㄅ" 或 "ㄅㄚ"）
   * @param {string|null} toneName - 聲調名稱（如 "tone1"），null 表示無聲調
   * @returns {string} 音檔路徑
   */
  _getAudioPath(syllable, toneName) {
    const hexParts = [...syllable].map(c =>
      c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
    );
    const base = hexParts.join('_');
    const filename = toneName ? `${base}_${toneName}.mp3` : `${base}.mp3`;
    return this.audioDir + filename;
  }

  /**
   * 取得聲調名稱（與下載腳本一致）
   * @param {{mark: string, name: string}} toneObj
   */
  _getToneName(toneObj) {
    // toneObj.name 如 "一聲"、"二聲"... 轉換為 "tone1"~"tone5"
    const map = {
      '一聲': 'tone1',
      '二聲': 'tone2',
      '三聲': 'tone3',
      '四聲': 'tone4',
      '輕聲': 'tone5',
    };
    return map[toneObj.name] || 'tone1';
  }

  // ─── 主要 API ─────────────────────────────────────────────────────────────

  /**
   * 播放注音發音
   * @param {string} syllable - 注音字串
   * @param {{mark: string, name: string, class: string}} toneObj - 聲調物件
   */
  async speak(syllable, toneObj) {
    // 停止目前正在播放的音訊
    this.stop();

    // 決定音檔路徑
    let audioPath;
    const isLevel1Single = syllable.length === 1; // Level 1：單一符號

    if (isLevel1Single) {
      // Level 1 單音：直接用無聲調的音檔
      audioPath = this._getAudioPath(syllable, null);
    } else {
      // Level 2, 3, 4：帶聲調
      const toneName = this._getToneName(toneObj);
      audioPath = this._getAudioPath(syllable, toneName);
    }

    // Layer 1：嘗試播放靜態音檔
    const played = await this._playStaticAudio(audioPath);
    if (played) return;

    // Layer 2：Fallback 到 Web Speech API
    console.warn(`[TTS Engine] 音檔不存在，使用 Web Speech API 備援：${audioPath}`);
    this._speakWithWebSpeech(syllable, toneObj, isLevel1Single);
  }

  /** 停止目前播放 */
  stop() {
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio.currentTime = 0;
      this._currentAudio = null;
    }
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  // ─── Layer 1：靜態音檔播放 ───────────────────────────────────────────────

  /**
   * 嘗試播放靜態 MP3 音檔
   * @param {string} audioPath - 相對路徑
   * @returns {Promise<boolean>} 是否成功播放
   */
  async _playStaticAudio(audioPath) {
    // 若已確認缺失，直接跳過
    if (this._missingFiles.has(audioPath)) return false;

    // 若 manifest 已載入且不在列表中，直接跳過
    if (this._existingFiles.size > 0 && !this._existingFiles.has(audioPath)) {
      this._missingFiles.add(audioPath);
      return false;
    }

    return new Promise((resolve) => {
      const audio = new Audio(audioPath);
      audio.volume = this.volume;
      audio.playbackRate = this.playbackRate;

      // 設定較短的 preload 策略（行動裝置友善）
      audio.preload = 'auto';

      audio.addEventListener('canplaythrough', () => {
        this._currentAudio = audio;
        audio.play()
          .then(() => resolve(true))
          .catch((err) => {
            console.warn('[TTS Engine] 音訊播放失敗:', err);
            resolve(false);
          });
      }, { once: true });

      audio.addEventListener('error', (e) => {
        // 音檔不存在或無法載入
        this._missingFiles.add(audioPath);
        this._existingFiles.delete(audioPath);
        resolve(false);
      }, { once: true });

      // 2 秒內若無回應，放棄並 fallback
      const timeout = setTimeout(() => {
        audio.src = '';
        resolve(false);
      }, 2000);

      audio.addEventListener('canplaythrough', () => clearTimeout(timeout), { once: true });
      audio.addEventListener('error', () => clearTimeout(timeout), { once: true });

      audio.load();
    });
  }

  // ─── Layer 2：Web Speech API 備援 ────────────────────────────────────────

  /**
   * 注音符號的特殊對應表（確保各平台都能正確發音）
   * 使用與原始 app.js 相同的對應邏輯
   */
  get _symbolPronunciationMap() {
    return {
      'ㄅ': 'ㄅ', 'ㄆ': 'ㄆ', 'ㄇ': 'ㄇ', 'ㄈ': 'ㄈ',
      'ㄉ': 'ㄉ', 'ㄊ': 'ㄊ', 'ㄋ': 'ㄋ', 'ㄌ': 'ㄌ',
      'ㄍ': 'ㄍ', 'ㄎ': 'ㄎ', 'ㄏ': 'ㄏ',
      'ㄐ': 'ㄐ', 'ㄑ': 'ㄑ', 'ㄒ': 'ㄒ',
      'ㄓ': 'ㄓ', 'ㄔ': 'ㄔ', 'ㄕ': 'ㄕ', 'ㄖ': '日',
      'ㄗ': 'ㄗ', 'ㄘ': 'ㄘ', 'ㄙ': 'ㄙ',
      'ㄧ': 'ㄧ', 'ㄨ': 'ㄨ', 'ㄩ': 'ㄩ',
      'ㄚ': 'ㄚ', 'ㄛ': '噢', 'ㄜ': 'ㄜ', 'ㄝ': 'ㄝ',
      'ㄞ': 'ㄞ', 'ㄟ': 'ㄟ', 'ㄠ': 'ㄠ', 'ㄡ': 'ㄡ',
      'ㄢ': 'ㄢ', 'ㄣ': 'ㄣ', 'ㄤ': 'ㄤ', 'ㄥ': 'ㄥ', 'ㄦ': 'ㄦ',
    };
  }

  /**
   * Web Speech API 備援發音
   * @param {string} syllable
   * @param {object} toneObj
   * @param {boolean} isLevel1Single
   */
  _speakWithWebSpeech(syllable, toneObj, isLevel1Single) {
    if (typeof speechSynthesis === 'undefined') return;

    speechSynthesis.cancel();

    let textToSpeak;
    const INITIALS = window.BopomofoData ? window.BopomofoData.initials : [];
    const isInitial = INITIALS.includes(syllable);

    if (isLevel1Single) {
      if (isInitial) {
        textToSpeak = this._symbolPronunciationMap[syllable] || syllable;
      } else {
        // 韻母/介音：不加聲調（level 1 一聲）
        textToSpeak = this._symbolPronunciationMap[syllable] || syllable;
      }
    } else {
      // 組合音：帶聲調朗讀
      const firstChar = syllable[0];
      if (syllable === 'ㄛ' || firstChar === 'ㄛ') {
        textToSpeak = syllable.replace('ㄛ', '噢') + toneObj.mark;
      } else {
        textToSpeak = syllable + toneObj.mark;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // 優先選台灣口音
    const voice = this._webSpeechVoices.find(v => v.lang.includes('zh-TW'))
      || this._webSpeechVoices.find(v => v.lang.includes('zh-HK'))
      || this._webSpeechVoices.find(v => v.lang.includes('zh-CN'))
      || this._webSpeechVoices.find(v => v.lang.includes('zh'));

    if (voice) utterance.voice = voice;
    utterance.lang = 'zh-TW';
    utterance.rate = 0.75;
    utterance.volume = this.volume;

    setTimeout(() => speechSynthesis.speak(utterance), 50);
  }

  // ─── 公開 API：音量控制 ───────────────────────────────────────────────────

  /** 設定播放音量 (0.0 ~ 1.0) */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this._currentAudio) {
      this._currentAudio.volume = this.volume;
    }
  }

  /**
   * 解鎖 iOS 音訊（需在使用者互動後呼叫）
   * iOS 要求用戶互動後才能播放音訊
   */
  prime() {
    // 播放一段無聲的音訊以解鎖 iOS Audio Policy
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      ctx.close();
    } catch (e) {
      // 忽略
    }

    // 同時預熱 Web Speech API（備援用）
    if (typeof speechSynthesis !== 'undefined') {
      try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        speechSynthesis.speak(u);
      } catch (e) {
        // 忽略
      }
    }
  }
}

// ─── 實例化並掛載至全域 ──────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.TTSEngine = new BopomofoTTSEngine();
  console.log('[TTS Engine] v2.0 初始化完成（靜態音檔 + Web Speech API 備援）');
}
