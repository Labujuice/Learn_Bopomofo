/**
 * ㄅㄆㄇㄈ 發音引擎 v3.0 - 跨平台一致性解決方案（iOS 終極解法：單一 Audio 元素重用）
 *
 * 架構：
 *   Layer 1 (優先) - 靜態音檔播放 (100% 一致，來自預先生成的 MP3)
 *   Layer 2 (備援) - Web Speech API (各平台有差異，僅在音檔缺失時使用)
 *
 * iOS 終極解法：
 *   - 避免每次 speak() 建立 `new Audio()`。在 iOS 上，即使在 user activation 中，
 *     動態建立的 Audio 有時仍會被視為無權限。
 *   - 採用「單一 Audio 實例重用」策略：
 *     1. 在 constructor 建立單一個 `this._audio`。
 *     2. prime() 時，在 user gesture 內以真實 MP3 (ㄅ) 進行靜音播放。
 *     3. speak() 時，只修改 `this._audio.src` 並呼叫 `play()`。
 */

class BopomofoTTSEngine {
  constructor() {
    /** 音檔目錄（相對於 HTML 所在位置）*/
    this.audioDir = 'audio/';

    /** 音量 (0.0 ~ 1.0) */
    this.volume = 0.8;
    this.playbackRate = 0.85;

    /** 
     * 單一共享的 HTMLAudioElement（iOS 破關關鍵）
     * 預先建立好，而不是每次播放才 new。
     */
    this._audio = new Audio();

    /** Web Speech API 語音列表（備援用）*/
    this._webSpeechVoices = [];

    /** 已確認存在的音檔 cache（避免重複 404 請求）*/
    this._existingFiles = new Set();
    this._missingFiles = new Set();

    this._iosAudioUnlocked = false;

    this._initWebSpeech();
    this._loadManifest();
  }

  // ─── 初始化與工具 ─────────────────────────────────────────────────────────

  _initWebSpeech() {
    if (typeof speechSynthesis === 'undefined') return;
    const loadVoices = () => {
      this._webSpeechVoices = speechSynthesis.getVoices();
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  async _loadManifest() {
    try {
      const res = await fetch(this.audioDir + 'manifest.json');
      if (!res.ok) return;
      const manifest = await res.json();
      for (const key of Object.keys(manifest)) {
        this._existingFiles.add(manifest[key]);
      }
      console.log(`[TTS Engine] manifest 載入完成，共 ${this._existingFiles.size} 個音檔`);
    } catch (e) {
      console.warn('[TTS Engine] 無法載入 manifest.json');
    }
  }

  _getAudioPath(syllable, toneName) {
    const hexParts = [...syllable].map(c =>
      c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
    );
    const base = hexParts.join('_');
    const filename = toneName ? `${base}_${toneName}.mp3` : `${base}.mp3`;
    return this.audioDir + filename;
  }

  _getToneName(toneObj) {
    const map = {
      '一聲': 'tone1', '二聲': 'tone2', '三聲': 'tone3', '四聲': 'tone4', '輕聲': 'tone5',
    };
    return map[toneObj.name] || 'tone1';
  }

  // ─── 主要播放 API ─────────────────────────────────────────────────────────

  /**
   * 播放注音發音
   * @param {string} syllable 
   * @param {object} toneObj 
   */
  speak(syllable, toneObj) {
    this.stop();

    const isLevel1Single = syllable.length === 1;
    const audioPath = isLevel1Single
      ? this._getAudioPath(syllable, null)
      : this._getAudioPath(syllable, this._getToneName(toneObj));

    // 已知缺失的音檔 -> Web Speech API
    if (this._missingFiles.has(audioPath) ||
        (this._existingFiles.size > 0 && !this._existingFiles.has(audioPath))) {
      this._speakWithWebSpeech(syllable, toneObj, isLevel1Single);
      return;
    }

    // 重用共用的 Audio 實例來播放
    this._playStaticAudio(audioPath, () => {
      this._speakWithWebSpeech(syllable, toneObj, isLevel1Single);
    });
  }

  stop() {
    if (this._audio) {
      try {
        this._audio.pause();
        this._audio.currentTime = 0;
      } catch(e) {}
    }
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this._audio) {
      this._audio.volume = this.volume;
    }
  }

  // ─── Layer 1：靜態音檔播放 (重用實例) ───────────────────────────────────

  _playStaticAudio(audioPath, onFail) {
    // 設定 src 前必須確保先呼叫了 prime()，才能無縫播放
    this._audio.src = audioPath;
    this._audio.volume = this.volume;
    this._audio.playbackRate = this.playbackRate;
    this._audio.preload = 'auto';

    let settled = false;

    const succeed = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
      }
    };

    const fail = (markMissing = false) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        try { this._audio.src = ''; } catch(e) {}
        if (markMissing) {
          this._missingFiles.add(audioPath);
          this._existingFiles.delete(audioPath);
        }
        if (onFail) onFail();
      }
    };

    const timeout = setTimeout(() => {
      console.warn('[TTS Engine] 播放超時，fallback');
      fail();
    }, 3000);

    const playPromise = this._audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(succeed)
        .catch((err) => {
          if (err.name === 'NotSupportedError') {
            console.warn('[TTS Engine] 不支援或不存在:', audioPath);
            fail(true);
          } else if (err.name === 'NotAllowedError') {
            console.warn('[TTS Engine] 播放被阻止(NotAllowed)，未正確 prime。');
            fail();
          } else if (err.name === 'AbortError') {
            // iOS 常常會在快速切換 src 時觸發 AbortError，但其實是可以正常播放的，我們忽視它或 fallback
            console.warn('[TTS Engine] AbortError:', err.message);
            fail();
          } else {
            console.warn('[TTS Engine] play() 錯誤:', err.name);
            fail();
          }
        });
    } else {
      succeed();
    }
  }

  // ─── Layer 2：Web Speech API 備援 ────────────────────────────────────────

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
        textToSpeak = this._symbolPronunciationMap[syllable] || syllable;
      }
    } else {
      const firstChar = syllable[0];
      if (syllable === 'ㄛ' || firstChar === 'ㄛ') {
        textToSpeak = syllable.replace('ㄛ', '噢') + toneObj.mark;
      } else {
        textToSpeak = syllable + toneObj.mark;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
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

  // ─── 解鎖 iOS 音訊 (Prime) ───────────────────────────────────────────────

  prime() {
    // 1. 解鎖單一共用的 <audio>
    if (!this._iosAudioUnlocked) {
      try {
        // 使用真實存在的 MP3
        this._audio.src = this.audioDir + '3105.mp3'; // ㄅ
        this._audio.volume = 0; // 靜音
        const p = this._audio.play();
        if (p) {
          p.then(() => {
            this._iosAudioUnlocked = true;
            this._audio.pause();
            this._audio.volume = this.volume;
            console.log('[TTS Engine] iOS <audio> 解鎖成功（重用實例）');
          }).catch((e) => {
            console.warn('[TTS Engine] iOS unlock 失敗:', e.name);
          });
        }
      } catch (e) {}
    }

    // 2. 預熱 Web Speech API
    if (typeof speechSynthesis !== 'undefined') {
      try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
  }
}

// 掛載至全域
if (typeof window !== 'undefined') {
  window.TTSEngine = new BopomofoTTSEngine();
  console.log('[TTS Engine] v3.0 初始化完成（靜態音檔 + 單一 Audio 實例）');
}
