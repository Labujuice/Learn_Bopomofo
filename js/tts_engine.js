/**
 * ㄅㄆㄇㄈ 發音引擎 v2.1 - 跨平台一致性解決方案（含 iOS 修正）
 *
 * 架構：
 *   Layer 1 (優先) - 靜態音檔播放 (100% 一致，來自預先生成的 MP3)
 *   Layer 2 (備援) - Web Speech API (各平台有差異，僅在音檔缺失時使用)
 *
 * 音檔命名規則：使用注音字元的 Unicode 碼點 Hex 串
 *   單音：例如 ㄅ(U+3105) => "3105.mp3"
 *   組合音+聲調：例如 ㄅㄚ一聲 => "3105_311A_tone1.mp3"
 *
 * iOS 注意事項：
 *   - iOS Safari 要求 audio.play() 必須在 user gesture 的同步/microtask 鏈內呼叫
 *   - prime() 會用 data-URI 靜音音檔解鎖 <audio> 元素播放權限
 *   - _playStaticAudio() 直接呼叫 play()，不等待 canplaythrough，確保留在 activation context
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

    /**
     * iOS <audio> 解鎖旗標
     * iOS Safari 需要在 user gesture 內先 play() 過一次 <audio>，
     * 之後同一 activation session 內的 audio.play() 才不會被擋。
     */
    this._iosAudioUnlocked = false;

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
   *
   * iOS 關鍵設計：
   *   直接呼叫 audio.play() 而不等待 canplaythrough。
   *   原因：iOS Safari 的 user activation 只在 user gesture 的
   *   同步呼叫鏈及其 microtask（Promise chain）內有效。
   *   等待 canplaythrough（網路 I/O 事件）時已脫離 activation context，
   *   iOS 會拋出 NotAllowedError 並 fallback 到 Web Speech API。
   *
   * @param {string} audioPath - 相對路徑
   * @returns {Promise<boolean>} 是否成功播放
   */
  _playStaticAudio(audioPath) {
    // 若已確認缺失，直接跳過
    if (this._missingFiles.has(audioPath)) return Promise.resolve(false);

    // 若 manifest 已載入且不在列表中，直接跳過
    if (this._existingFiles.size > 0 && !this._existingFiles.has(audioPath)) {
      this._missingFiles.add(audioPath);
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const audio = new Audio(audioPath);
      audio.volume = this.volume;
      audio.playbackRate = this.playbackRate;

      // 3 秒 timeout（行動裝置網路較慢）
      const timeout = setTimeout(() => {
        audio.src = '';
        resolve(false);
      }, 3000);

      /**
       * 直接呼叫 play()，不等 canplaythrough。
       * 瀏覽器會在資料緩衝足夠時自動開始播放。
       * play() 回傳的 Promise 在播放真正開始後 resolve。
       */
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            clearTimeout(timeout);
            this._currentAudio = audio;
            resolve(true);
          })
          .catch((err) => {
            clearTimeout(timeout);
            if (err.name === 'NotSupportedError') {
              // 音檔格式不支援或路徑不存在
              this._missingFiles.add(audioPath);
              this._existingFiles.delete(audioPath);
            } else if (err.name === 'NotAllowedError') {
              // iOS/瀏覽器阻止播放（不在 user activation context）
              console.warn('[TTS Engine] 播放被阻止（NotAllowedError），請確認已呼叫 prime()');
            } else {
              console.warn('[TTS Engine] play() 失敗:', err.name, err.message);
            }
            resolve(false);
          });
      } else {
        // 舊版 API（不回傳 Promise）：改用事件監聽
        audio.addEventListener('playing', () => {
          clearTimeout(timeout);
          this._currentAudio = audio;
          resolve(true);
        }, { once: true });
        audio.addEventListener('error', () => {
          clearTimeout(timeout);
          this._missingFiles.add(audioPath);
          resolve(false);
        }, { once: true });
      }
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
   * 解鎖 iOS 音訊（必須在使用者互動事件內同步呼叫）
   *
   * iOS Safari 的 <audio> 播放限制：
   *   任何 audio.play() 都必須在 user gesture（touch/click）的
   *   同步呼叫內或其 microtask 鏈內發起，否則會被 NotAllowedError 擋掉。
   *
   *   修正策略：
   *   1. 用 data-URI 靜音 WAV 建立 Audio 元素並立即 play()，
   *      這會「解鎖」iOS 本次 session 的 <audio> 播放權限。
   *   2. 解鎖 Web Audio API context（背景音樂用）。
   *   3. 預熱 Web Speech API（備援用）。
   */
  prime() {
    // ── 1. 解鎖 <audio> 元素（iOS 最關鍵的步驟）──────────────────────────
    if (!this._iosAudioUnlocked) {
      try {
        // 最小合法 WAV (44 bytes, 靜音, 1 sample @ 8kHz mono)
        const SILENT_WAV = 'data:audio/wav;base64,' +
          'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        const unlockAudio = new Audio(SILENT_WAV);
        unlockAudio.volume = 0;
        const p = unlockAudio.play();
        if (p) {
          p.then(() => {
            this._iosAudioUnlocked = true;
            console.log('[TTS Engine] iOS <audio> 解鎖成功');
          }).catch(() => {
            // 部分情境下靜音 data-URI 也可能失敗，不影響主流程
          });
        }
      } catch (e) {
        // 忽略
      }
    }

    // ── 2. 解鎖 Web Audio API（背景音樂 BGM 用）───────────────────────────
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

    // ── 3. 預熱 Web Speech API（備援層用）─────────────────────────────────
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
  console.log('[TTS Engine] v2.1 初始化完成（靜態音檔 + iOS 修正 + Web Speech API 備援）');
}
