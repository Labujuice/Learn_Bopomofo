// ㄅㄆ模ㄈ 發音出題機 - 核心邏輯、語音與出題生成器

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
  
  // 遊戲評判按鈕
  const btnJudgeCorrect = document.getElementById('btn-judge-correct');
  const btnJudgeWrong = document.getElementById('btn-judge-wrong');
  
  // 遊戲進行中 UI 元素
  const gamePlayerName = document.getElementById('game-player-name');
  const gameScore = document.getElementById('game-score');
  const questionProgress = document.getElementById('question-progress');
  const bopomofoDisplayBox = document.getElementById('bopomofo-display-box');
  const heartsContainer = document.getElementById('hearts-container');
  const feedbackOverlay = document.getElementById('feedback-overlay');
  
  // 結算畫面元素
  const resultTitle = document.getElementById('result-title');
  const resultPlayerName = document.getElementById('result-player-name');
  const resultLevel = document.getElementById('result-level');
  const resultScore = document.getElementById('result-score');
  const resultAccuracy = document.getElementById('result-accuracy');
  const resultDatetime = document.getElementById('result-datetime');
  const resultHeader = document.getElementById('result-header');

  // --- 遊戲狀態管理 ---
  const gameState = {
    playerName: '',
    level: 1,
    score: 0,
    lives: 3,
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    isActive: false
  };

  // --- 語音合成 (TTS) 初始化與優化 ---
  let voices = [];
  
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
    
    speechSynthesis.cancel();
    
    let textToSpeak = syllable;
    
    // 針對單一符號的聲調處理 (Lv.1)
    if (syllable.length === 1) {
      const isInitial = window.BopomofoData.initials.includes(syllable);
      if (isInitial) {
        textToSpeak = `${syllable}，唸${toneObj.name}`;
      } else {
        textToSpeak = syllable + toneObj.mark;
      }
    } else {
      textToSpeak = syllable + toneObj.mark;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const twVoice = voices.find(v => v.lang.includes('zh-TW')) || 
                    voices.find(v => v.lang.includes('zh-HK')) || 
                    voices.find(v => v.lang.includes('zh-CN')) || 
                    voices.find(v => v.lang.includes('zh'));
                    
    if (twVoice) {
      utterance.voice = twVoice;
    }
    
    utterance.lang = 'zh-TW';
    utterance.rate = 0.75;
    
    if (window.AudioManager) {
      utterance.volume = window.AudioManager.sfxVolume;
    }
    
    speechSynthesis.speak(utterance);
  }

  // --- 隨機姓名產生器 ---
  function getRandomPlayerName() {
    const data = window.BopomofoData;
    const adj = data.fruitAdjectives[Math.floor(Math.random() * data.fruitAdjectives.length)];
    const fruit = data.fruitNames[Math.floor(Math.random() * data.fruitNames.length)];
    return adj + fruit;
  }

  // --- 隨機出題生成器 ---
  function generateQuestionList(level) {
    const questions = [];
    const data = window.BopomofoData;
    
    for (let i = 0; i < 10; i++) {
      let syllable = '';
      let toneObj = data.tones[Math.floor(Math.random() * data.tones.length)];
      let scoreValue = 0;
      
      switch (level) {
        case 1:
          syllable = data.allSymbols[Math.floor(Math.random() * data.allSymbols.length)];
          scoreValue = 1;
          break;
          
        case 2:
          syllable = data.twoPinyinList[Math.floor(Math.random() * data.twoPinyinList.length)];
          scoreValue = 2;
          break;
          
        case 3:
          syllable = data.threePinyinList[Math.floor(Math.random() * data.threePinyinList.length)];
          scoreValue = 3;
          break;
          
        case 4:
          const isThreePinyin = Math.random() > 0.5;
          if (isThreePinyin) {
            syllable = data.threePinyinList[Math.floor(Math.random() * data.threePinyinList.length)];
            scoreValue = 3;
          } else {
            syllable = data.twoPinyinList[Math.floor(Math.random() * data.twoPinyinList.length)];
            scoreValue = 2;
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

  // --- 遊戲邏輯控制 ---

  // 開始新遊戲
  function startNewGame(level) {
    // 取得或生成玩家名字
    let name = playerNameInput.value.trim();
    if (!name) {
      name = getRandomPlayerName();
    }
    
    // 初始化狀態
    gameState.playerName = name;
    gameState.level = level;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.questions = generateQuestionList(level);
    gameState.currentIndex = 0;
    gameState.correctCount = 0;
    gameState.isActive = true;
    
    // 更新 UI 資訊
    gamePlayerName.textContent = name;
    gameScore.textContent = '0';
    updateHearts();
    
    // 進入遊戲畫面
    showScreen(screenGame);
    
    // 開始背景音樂
    if (window.AudioManager) {
      window.AudioManager.startBGM();
    }
    
    // 載入第一題
    loadQuestion();
  }

  // 更新愛心 UI
  function updateHearts() {
    heartsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = '❤️';
      if (i >= gameState.lives) {
        heart.classList.add('lost');
      }
      heartsContainer.appendChild(heart);
    }
  }

  // 載入目前題目
  function loadQuestion() {
    if (gameState.currentIndex >= gameState.questions.length) {
      endGame(true); // 順利通關
      return;
    }
    
    const q = gameState.questions[gameState.currentIndex];
    questionProgress.textContent = `第 ${gameState.currentIndex + 1} / 10 題`;
    
    // 拆解字元以支援 CSS 直書堆疊
    const chars = q.syllable.split('');
    const lenClass = `len-${chars.length}`;
    const charStackHtml = chars.map(c => `<span>${c}</span>`).join('');
    
    bopomofoDisplayBox.innerHTML = `
      <div class="bopomofo-char-stack ${lenClass}">
        ${charStackHtml}
      </div>
      ${q.tone.mark ? `<span class="bopomofo-tone ${q.tone.class}">${q.tone.mark}</span>` : ''}
    `;
    
    // 自動播放發音
    speakCurrentQuestion();
  }

  // 播放當前題目發音
  function speakCurrentQuestion() {
    if (!gameState.isActive) return;
    const q = gameState.questions[gameState.currentIndex];
    speakBopomofo(q.syllable, q.tone);
  }

  // 答題評判處理
  function judgeAnswer(isCorrect) {
    if (!gameState.isActive) return;
    
    const currentQuestion = gameState.questions[gameState.currentIndex];
    
    if (isCorrect) {
      // 答對邏輯
      gameState.score += currentQuestion.scoreValue;
      gameState.correctCount++;
      gameScore.textContent = gameState.score;
      
      // 播放答對音效與動畫
      if (window.AudioManager) window.AudioManager.playCorrectSound();
      showAnswerFeedback('correct');
    } else {
      // 答錯邏輯
      gameState.lives--;
      updateHearts();
      
      // 播放答錯音效與動畫
      if (window.AudioManager) window.AudioManager.playWrongSound();
      showAnswerFeedback('wrong');
      
      if (gameState.lives <= 0) {
        gameState.isActive = false;
        // 延遲一下讓動畫演完再進入結算
        setTimeout(() => endGame(false), 800);
        return;
      }
    }
    
    gameState.currentIndex++;
    
    // 延遲載入下一題，使答題動畫能被看見
    gameState.isActive = false;
    setTimeout(() => {
      gameState.isActive = true;
      loadQuestion();
    }, 800);
  }

  // 顯示⭕/❌視覺反饋
  function showAnswerFeedback(type) {
    feedbackOverlay.className = `feedback-overlay feedback-${type}`;
    
    if (type === 'wrong') {
      bopomofoDisplayBox.classList.add('shake');
      setTimeout(() => {
        bopomofoDisplayBox.classList.remove('shake');
      }, 500);
    }
    
    setTimeout(() => {
      feedbackOverlay.className = 'feedback-overlay hidden';
    }, 700);
  }

  // 遊戲結束結算
  function endGame(isWon) {
    gameState.isActive = false;
    
    // 停止背景音樂
    if (window.AudioManager) {
      window.AudioManager.stopBGM();
    }
    
    // 計算通關加分
    let finalScore = gameState.score;
    const accuracyStr = `${gameState.correctCount} / 10`;
    
    if (isWon) {
      finalScore += 10; // 通關紅利
      resultTitle.textContent = '恭喜通關！🎉';
      resultHeader.querySelector('.result-icon').textContent = '🏆';
      resultHeader.classList.remove('lost-title');
    } else {
      resultTitle.textContent = '再接再厲！💪';
      resultHeader.querySelector('.result-icon').textContent = '😢';
    }
    
    // 更新結算面板
    resultPlayerName.textContent = gameState.playerName;
    resultLevel.textContent = `Lv.${gameState.level}`;
    resultScore.textContent = `${finalScore} 分 ${isWon ? '(含通關紅利+10)' : ''}`;
    resultAccuracy.textContent = accuracyStr;
    
    const nowStr = new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    resultDatetime.textContent = nowStr;
    
    // 寫入本地排行榜
    saveToLeaderboard(finalScore, nowStr);
    
    // 切換到結算畫面
    showScreen(screenResult);
  }

  // 儲存至本地排行榜 (localStorage)
  function saveToLeaderboard(finalScore, datetime) {
    const newRecord = {
      name: gameState.playerName,
      level: gameState.level,
      score: finalScore,
      accuracy: `${gameState.correctCount}/10`,
      date: datetime
    };
    
    const records = JSON.parse(localStorage.getItem('bopomofo_leaderboard') || '[]');
    records.push(newRecord);
    localStorage.setItem('bopomofo_leaderboard', JSON.stringify(records));
  }

  // --- 畫面與 Modal 切換邏輯 ---
  
  function showScreen(screenToShow) {
    [screenMainMenu, screenGame, screenResult].forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });
    screenToShow.classList.remove('hidden');
    screenToShow.classList.add('active');
  }

  function openModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }

  function closeAllModals() {
    [modalSymbols, modalLeaderboard, modalSettings].forEach(modal => {
      modal.classList.add('hidden');
      modal.classList.remove('active');
    });
  }

  // --- 事件監聽器設定 ---

  btnOpenSymbols.addEventListener('click', () => {
    openModal(modalSymbols);
  });

  btnOpenLeaderboard.addEventListener('click', () => {
    openModal(modalLeaderboard);
  });

  btnOpenSettings.addEventListener('click', () => {
    openModal(modalSettings);
  });

  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });

  // 選擇關卡開始遊戲
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.getAttribute('data-level'));
      startNewGame(level);
    });
  });

  // 聽聽看按鈕
  btnTtsGuide.addEventListener('click', speakCurrentQuestion);

  // 評判按鈕
  btnJudgeCorrect.addEventListener('click', () => judgeAnswer(true));
  btnJudgeWrong.addEventListener('click', () => judgeAnswer(false));

  // 結算畫面按鈕
  btnReplay.addEventListener('click', () => {
    startNewGame(gameState.level);
  });

  btnGoHome.addEventListener('click', () => {
    showScreen(screenMainMenu);
  });

  // 暴露至全域
  window.speakBopomofo = speakBopomofo;
  window.judgeAnswer = judgeAnswer;

  console.log('遊戲核心流程控制模組載入完成！');
});
