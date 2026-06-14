// ㄅㄆㄇㄈ 發音出題機 - 聲音合成管理器 (Web Audio API)

class BopomofoAudioManager {
  constructor() {
    this.audioCtx = null;
    this.bgmGainNode = null;
    this.sfxGainNode = null;
    
    // 預設音量
    this.bgmVolume = 0.3;
    this.sfxVolume = 0.8;
    
    this.bgmPlaying = false;
    this.currentNoteIndex = 0;
    this.nextNoteTime = 0;
    this.schedulerTimerId = null;
    
    // 溫馨的童趣 8-bit 背景音樂旋律 (C大調，使用和弦與簡單旋律)
    this.NOTE_FREQS = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'rest': 0
    };
    
    // 旋律陣列 (note: 音高, dur: 拍數/秒數)
    this.MELODY = [
      { note: 'C5', dur: 0.4 }, { note: 'E5', dur: 0.4 }, { note: 'G5', dur: 0.4 }, { note: 'C5', dur: 0.4 },
      { note: 'A4', dur: 0.4 }, { note: 'C5', dur: 0.4 }, { note: 'F5', dur: 0.4 }, { note: 'A4', dur: 0.4 },
      { note: 'G4', dur: 0.4 }, { note: 'B4', dur: 0.4 }, { note: 'D5', dur: 0.4 }, { note: 'G4', dur: 0.4 },
      { note: 'C5', dur: 0.8 }, { note: 'rest', dur: 0.4 },
      
      { note: 'E5', dur: 0.4 }, { note: 'D5', dur: 0.4 }, { note: 'C5', dur: 0.4 }, { note: 'D5', dur: 0.4 },
      { note: 'E5', dur: 0.4 }, { note: 'E5', dur: 0.4 }, { note: 'E5', dur: 0.8 },
      { note: 'D5', dur: 0.4 }, { note: 'D5', dur: 0.4 }, { note: 'D5', dur: 0.8 },
      { note: 'E5', dur: 0.4 }, { note: 'G5', dur: 0.4 }, { note: 'G5', dur: 0.8 },
      
      { note: 'E5', dur: 0.4 }, { note: 'D5', dur: 0.4 }, { note: 'C5', dur: 0.4 }, { note: 'D5', dur: 0.4 },
      { note: 'E5', dur: 0.4 }, { note: 'E5', dur: 0.4 }, { note: 'E5', dur: 0.4 }, { note: 'C5', dur: 0.4 },
      { note: 'D5', dur: 0.4 }, { note: 'D5', dur: 0.4 }, { note: 'E5', dur: 0.4 }, { note: 'D5', dur: 0.4 },
      { note: 'C5', dur: 1.2 }, { note: 'rest', dur: 0.8 }
    ];
  }

  // 初始化 AudioContext (需在使用者點擊後觸發)
  init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }
    
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // 建立音量控制器
      this.bgmGainNode = this.audioCtx.createGain();
      this.sfxGainNode = this.audioCtx.createGain();
      
      this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, this.audioCtx.currentTime);
      this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
      
      this.bgmGainNode.connect(this.audioCtx.destination);
      this.sfxGainNode.connect(this.audioCtx.destination);
      
      console.log('AudioContext 初始化成功！');
    } catch (e) {
      console.error('瀏覽器不支援 Web Audio API', e);
    }
  }

  // 設定 BGM 音量 (0.0 ~ 1.0)
  setBGMVolume(vol) {
    this.bgmVolume = vol;
    if (this.bgmGainNode && this.audioCtx) {
      this.bgmGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
  }

  // 設定 SFX 音量 (0.0 ~ 1.0)
  setSFXVolume(vol) {
    this.sfxVolume = vol;
    if (this.sfxGainNode && this.audioCtx) {
      this.sfxGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
  }

  // 播放「答對 (叮咚)」音效
  playCorrectSound() {
    this.init();
    if (!this.audioCtx) return;
    
    const now = this.audioCtx.currentTime;
    
    // 叮咚音效：兩個連續的高頻正弦波 (C5 -> E5)
    this.playTone(523.25, 0.12, 'sine', now);
    this.playTone(659.25, 0.25, 'sine', now + 0.1);
  }

  // 播放「答錯 (benben)」音效
  playWrongSound() {
    this.init();
    if (!this.audioCtx) return;
    
    const now = this.audioCtx.currentTime;
    
    // benben音效：兩個連續低頻鋸齒波/三角波，帶有音高衰減 (130Hz -> 100Hz)
    this.playTone(130.81, 0.15, 'triangle', now, true);
    this.playTone(110.00, 0.25, 'triangle', now + 0.14, true);
  }

  // 播放單音輔助函式
  playTone(freq, duration, type = 'sine', startTime = 0, pitchSlide = false) {
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = type;
    
    if (pitchSlide) {
      // 頻率向下滑落效果
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startTime + duration);
    } else {
      osc.frequency.setValueAtTime(freq, startTime);
    }
    
    // 音量淡入淡出，防爆音
    gainNode.gain.setValueAtTime(this.sfxVolume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // 背景音樂排程器
  scheduler() {
    if (!this.bgmPlaying || !this.audioCtx) return;
    
    // 預排 100 毫秒內的音符
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      const noteObj = this.MELODY[this.currentNoteIndex];
      const freq = this.NOTE_FREQS[noteObj.note];
      
      if (freq > 0) {
        // 播放背景音樂的單音 (使用溫和的三角波，很有 FC/NES 紅白機風格)
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.nextNoteTime);
        
        // 音量包絡線：稍微有撥弦感 (緩起音、慢衰減)
        gainNode.gain.setValueAtTime(0, this.nextNoteTime);
        gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.5, this.nextNoteTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + noteObj.dur - 0.02);
        
        osc.connect(gainNode);
        gainNode.connect(this.bgmGainNode);
        
        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + noteObj.dur);
      }
      
      // 更新下一個音符的時間與索引
      this.nextNoteTime += noteObj.dur;
      this.currentNoteIndex = (this.currentNoteIndex + 1) % this.MELODY.length;
    }
    
    // 每 50ms 檢查一次是否需要排程新音符
    this.schedulerTimerId = setTimeout(() => this.scheduler(), 50);
  }

  // 開始背景音樂
  startBGM() {
    this.init();
    if (!this.audioCtx || this.bgmPlaying) return;
    
    // 恢復因瀏覽器政策暫停的 AudioContext
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    this.bgmPlaying = true;
    this.nextNoteTime = this.audioCtx.currentTime;
    this.scheduler();
    console.log('背景音樂已啟動');
  }

  // 停止背景音樂
  stopBGM() {
    this.bgmPlaying = false;
    if (this.schedulerTimerId) {
      clearTimeout(this.schedulerTimerId);
      this.schedulerTimerId = null;
    }
    console.log('背景音樂已暫停');
  }
}

// 實例化並掛載至 window
if (typeof window !== 'undefined') {
  window.AudioManager = new BopomofoAudioManager();
}
