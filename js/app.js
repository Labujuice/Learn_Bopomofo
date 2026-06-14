// ㄅㄆㄇㄈ 發音出題機 - 核心邏輯、語音與出題生成器

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM 元素宣告 ---
  // 畫面 (Screens)
  const screenMainMenu = document.getElementById('main-menu');
  const screenGame = document.getElementById('game-screen');
  const screenResult = document.getElementById('result-screen');
  
  // Modals
  const modalSymbols = document.getElementById('modal-symbols');
  const modalLeaderboard = document.getElementById('modal-leaderboard');
  const modalSettings = document.getElementById('modal-settings');
  
  // 按鈕與輸入框
  const playerNameInput = document.getElementById('player-name-input');
  const levelBtns = document.querySelectorAll('.btn-level');
  
  const btnOpenSymbols = document.getElementById('btn-open-symbols');
  const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  
  const modalCloseBtns = document.querySelectorAll('.modal-close');
  
  const btnReplay = document.getElementById('btn-replay');
  const btnGoHome = document.getElementById('btn-go-home');
  const btnTtsGuide = document.getElementById('btn-tts-guide');
  
  // 遊戲進行中 UI 元素
  const gamePlayerName = document.getElementById('game-player-name');
  const gameScore = document.getElementById('game-score');
  const questionProgress = document.getElementById('question-progress');
  const bopomofoDisplayBox = document.getElementById('bopomofo-display-box');
  const heartsContainer = document.getElementById('hearts-container');

  // --- 語音合成 (TTS) 初始化與優化 ---
  let voices = [];
  
  // 預先載入語音清單 (為了解決 Chrome 非同步載入問題)
  function loadVoices() {
    if (typeof speechSynthesis === 'undefined') return;
    voices = speechSynthesis.getVoices();
  }
  
  loadVoices();
  if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // 播放注音發音 (TTS)
  function speakBopomofo(syllable, toneObj) {
    if (typeof speechSynthesis === 'undefined') {
      console.warn('此瀏覽器不支援語音合成 (TTS)');
      return;
    }
    
    // 取消之前所有正在播放的語音，避免重疊
    speechSynthesis.cancel();
    
    let textToSpeak = syllable;
    
    // 針對單一符號的聲調處理 (Lv.1)
    if (syllable.length === 1) {
      const isInitial = window.BopomofoData.initials.includes(syllable);
      if (isInitial) {
        // 聲母單獨無法拼出聲調發音，所以唸出「聲母 + 幾聲」
        textToSpeak = `${syllable}，唸${toneObj.name}`;
      } else {
        // 韻母與介音可以帶聲調發音 (例如：ㄚˊ)
        textToSpeak = syllable + toneObj.mark;
      }
    } else {
      // 兩拼與三拼直接帶上聲調 (例如：ㄅㄚˊ)
      textToSpeak = syllable + toneObj.mark;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // 尋找台灣 (zh-TW) 的語音
    const twVoice = voices.find(v => v.lang.includes('zh-TW')) || 
                    voices.find(v => v.lang.includes('zh-HK')) || 
                    voices.find(v => v.lang.includes('zh-CN')) || 
                    voices.find(v => v.lang.includes('zh'));
                    
    if (twVoice) {
      utterance.voice = twVoice;
    }
    
    utterance.lang = 'zh-TW';
    utterance.rate = 0.75; // 速度調慢，適合小朋友聽
    
    // 音量與系統音效音量同步
    if (window.AudioManager) {
      utterance.volume = window.AudioManager.sfxVolume;
    }
    
    speechSynthesis.speak(utterance);
  }

  // --- 隨機出題生成器 ---
  
  // 隨機選取陣列中的一個元素
  function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 根據等級生成 10 題的題目清單
  function generateQuestionList(level) {
    const questions = [];
    const data = window.BopomofoData;
    
    for (let i = 0; i < 10; i++) {
      let syllable = '';
      let toneObj = getRandomElement(data.tones);
      let scoreValue = 0;
      
      switch (level) {
        case 1:
          // Lv.1: 37個基礎符號中隨機一個
          syllable = getRandomElement(data.allSymbols);
          scoreValue = 1;
          break;
          
        case 2:
          // Lv.2: 合法兩拼組合
          syllable = getRandomElement(data.twoPinyinList);
          scoreValue = 2;
          break;
          
        case 3:
          // Lv.3: 合法三拼組合
          syllable = getRandomElement(data.threePinyinList);
          scoreValue = 3;
          break;
          
        case 4:
          // Lv.4: 隨機混合兩拼與三拼
          const isThreePinyin = Math.random() > 0.5;
          if (isThreePinyin) {
            syllable = getRandomElement(data.threePinyinList);
            scoreValue = 3; // 三拼為 3 分
          } else {
            syllable = getRandomElement(data.twoPinyinList);
            scoreValue = 2; // 兩拼為 2 分
          }
          break;
      }
      
      questions.push({
        syllable: syllable,
        tone: toneObj,
        scoreValue: scoreValue
      });
    }
    
    return questions;
  }

  // --- 畫面與 Modal 切換邏輯 ---
  
  // 切換目前顯示的畫面
  function showScreen(screenToShow) {
    [screenMainMenu, screenGame, screenResult].forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });
    screenToShow.classList.remove('hidden');
    screenToShow.classList.add('active');
  }

  // 開啟 Modal
  function openModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }

  // 關閉所有 Modals
  function closeAllModals() {
    [modalSymbols, modalLeaderboard, modalSettings].forEach(modal => {
      modal.classList.add('hidden');
      modal.classList.remove('active');
    });
  }

  // --- 事件監聽器設定 ---

  // 開啟各個 Modal
  btnOpenSymbols.addEventListener('click', () => {
    openModal(modalSymbols);
  });

  btnOpenLeaderboard.addEventListener('click', () => {
    openModal(modalLeaderboard);
  });

  btnOpenSettings.addEventListener('click', () => {
    openModal(modalSettings);
  });

  // 點擊 Modal 關閉按鈕
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // 點擊 Modal 外部背景也可以關閉 Modal
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });

  // 選擇關卡，進入遊戲
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLevel = parseInt(btn.getAttribute('data-level'));
      let playerName = playerNameInput.value.trim();
      
      // 如果未輸入名字，隨機選取水果名 (在步驟 6 實作，目前用預設)
      if (!playerName) {
        playerName = '隨機小夥伴';
      }
      
      console.log(`開始遊戲！玩家: ${playerName}, 關卡: Lv.${selectedLevel}`);
      
      // 進入遊戲畫面的模擬邏輯
      gamePlayerName.textContent = playerName;
      showScreen(screenGame);
      
      // 測試隨機生成題目
      const qs = generateQuestionList(selectedLevel);
      console.log('生成的題目：', qs);
    });
  });

  // 結算畫面按鈕
  btnReplay.addEventListener('click', () => {
    showScreen(screenGame);
  });

  btnGoHome.addEventListener('click', () => {
    showScreen(screenMainMenu);
  });

  // 暴露至全域方便未來調用與除錯
  window.speakBopomofo = speakBopomofo;
  window.generateQuestionList = generateQuestionList;

  console.log('TTS 語音發音與隨機出題模組載入完成！');
});
