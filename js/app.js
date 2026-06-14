// ㄅㄆㄇㄈ 發音出題機 - 完整核心邏輯與持久化

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

  // 設定面板元素
  const sliderBgm = document.getElementById('volume-bgm');
  const sliderSfx = document.getElementById('volume-sfx');
  const valVolumeBgm = document.getElementById('val-volume-bgm');
  const valVolumeSfx = document.getElementById('val-volume-sfx');
  const btnClearLeaderboard = document.getElementById('btn-clear-leaderboard');

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
    
    // 針對單一符號的聲調處理 (Lv.1 與 注音符號表)
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
      let isBlacklisted = true;
      
      while (isBlacklisted) {
        switch (level) {
          case 1:
            syllable = data.allSymbols[Math.floor(Math.random() * data.allSymbols.length)];
            toneObj = data.tones[0]; // Level 1 固定為一聲，不包含聲調變化
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
        
        // 檢查是否在黑名單中 (Level 1 單一音符不需要檢查黑名單)
        if (level === 1 || !data.blacklist || !data.blacklist.includes(syllable)) {
          isBlacklisted = false;
        }
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

  function startNewGame(level) {
    let name = playerNameInput.value.trim();
    if (!name) {
      name = getRandomPlayerName();
    }
    
    gameState.playerName = name;
    gameState.level = level;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.questions = generateQuestionList(level);
    gameState.currentIndex = 0;
    gameState.correctCount = 0;
    gameState.isActive = true;
    
    gamePlayerName.textContent = name;
    gameScore.textContent = '0';
    updateHearts();
    
    showScreen(screenGame);
    
    if (window.AudioManager) {
      window.AudioManager.startBGM();
    }
    
    loadQuestion();
  }

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

  function loadQuestion() {
    if (gameState.currentIndex >= gameState.questions.length) {
      endGame(true);
      return;
    }
    
    const q = gameState.questions[gameState.currentIndex];
    questionProgress.textContent = `第 ${gameState.currentIndex + 1} / 10 題`;
    
    const chars = q.syllable.split('');
    const lenClass = `len-${chars.length}`;
    const charStackHtml = chars.map(c => `<span>${c}</span>`).join('');
    
    bopomofoDisplayBox.innerHTML = `
      <div class="bopomofo-char-stack ${lenClass}">
        ${charStackHtml}
      </div>
      ${q.tone.mark ? `<span class="bopomofo-tone ${q.tone.class}">${q.tone.mark}</span>` : ''}
    `;
    
    // 出題時不應自動朗讀題目給小朋友，由主持人按下「聽正確發音」按鈕後播放
    // speakCurrentQuestion();
  }

  function speakCurrentQuestion() {
    if (!gameState.isActive) return;
    const q = gameState.questions[gameState.currentIndex];
    speakBopomofo(q.syllable, q.tone);
  }

  function judgeAnswer(isCorrect) {
    if (!gameState.isActive) return;
    
    const currentQuestion = gameState.questions[gameState.currentIndex];
    
    if (isCorrect) {
      gameState.score += currentQuestion.scoreValue;
      gameState.correctCount++;
      gameScore.textContent = gameState.score;
      
      if (window.AudioManager) window.AudioManager.playCorrectSound();
      showAnswerFeedback('correct');
    } else {
      gameState.lives--;
      updateHearts();
      
      if (window.AudioManager) window.AudioManager.playWrongSound();
      showAnswerFeedback('wrong');
      
      if (gameState.lives <= 0) {
        gameState.isActive = false;
        setTimeout(() => endGame(false), 800);
        return;
      }
    }
    
    gameState.currentIndex++;
    
    gameState.isActive = false;
    setTimeout(() => {
      gameState.isActive = true;
      loadQuestion();
    }, 800);
  }

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

  function endGame(isWon) {
    gameState.isActive = false;
    
    if (window.AudioManager) {
      window.AudioManager.stopBGM();
    }
    
    let finalScore = gameState.score;
    const accuracyStr = `${gameState.correctCount} / 10`;
    
    if (isWon) {
      finalScore += 10; // 通關紅利
      resultTitle.textContent = '恭喜通關！🎉';
      resultHeader.querySelector('.result-icon').textContent = '🏆';
    } else {
      resultTitle.textContent = '再接再厲！💪';
      resultHeader.querySelector('.result-icon').textContent = '😢';
    }
    
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
    
    saveToLeaderboard(finalScore, nowStr);
    
    showScreen(screenResult);
  }

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

  // --- 注音符號表渲染 ---
  function renderSymbolTable() {
    const data = window.BopomofoData;
    const gridInitials = document.getElementById('grid-initials');
    const gridMedials = document.getElementById('grid-medials');
    const gridFinals = document.getElementById('grid-finals');
    
    function populateGrid(grid, list) {
      grid.innerHTML = '';
      list.forEach(sym => {
        const item = document.createElement('div');
        item.className = 'symbol-item';
        item.textContent = sym;
        
        // 點擊後，以一聲（預設無標誌聲調）播放發音
        item.addEventListener('click', () => {
          speakBopomofo(sym, data.tones[0]);
        });
        
        grid.appendChild(item);
      });
    }
    
    populateGrid(gridInitials, data.initials);
    populateGrid(gridMedials, data.medials);
    populateGrid(gridFinals, data.finals);
  }

  // --- 排行榜渲染 ---
  let activeLeaderboardTab = 'all';

  function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    const emptyDiv = document.getElementById('leaderboard-empty');
    tbody.innerHTML = '';
    
    const records = JSON.parse(localStorage.getItem('bopomofo_leaderboard') || '[]');
    
    // 依選擇的頁籤篩選等級
    let filtered = records;
    if (activeLeaderboardTab !== 'all') {
      const lv = parseInt(activeLeaderboardTab);
      filtered = records.filter(r => r.level === lv);
    }
    
    // 排序：分數高至低；若分數相同，日期近至遠
    filtered.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.date) - new Date(a.date);
    });
    
    if (filtered.length === 0) {
      emptyDiv.classList.remove('hidden');
      return;
    } else {
      emptyDiv.classList.add('hidden');
    }
    
    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>Lv.${r.level}</td>
        <td>${r.score}分</td>
        <td>${r.date}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 排行榜頁籤切換
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLeaderboardTab = btn.getAttribute('data-tab');
      renderLeaderboard();
    });
  });

  // --- 設定與音量管理 ---
  
  function initSettings() {
    const savedBgm = localStorage.getItem('bopomofo_volume_bgm');
    const savedSfx = localStorage.getItem('bopomofo_volume_sfx');
    
    const bgmVolVal = savedBgm !== null ? parseInt(savedBgm) : 30;
    const sfxVolVal = savedSfx !== null ? parseInt(savedSfx) : 80;
    
    sliderBgm.value = bgmVolVal;
    valVolumeBgm.textContent = bgmVolVal;
    sliderSfx.value = sfxVolVal;
    valVolumeSfx.textContent = sfxVolVal;
    
    // 初始化設定音量至音訊管理器
    if (window.AudioManager) {
      window.AudioManager.setBGMVolume(bgmVolVal / 100);
      window.AudioManager.setSFXVolume(sfxVolVal / 100);
    }
  }

  sliderBgm.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valVolumeBgm.textContent = val;
    if (window.AudioManager) {
      window.AudioManager.setBGMVolume(val / 100);
    }
    localStorage.setItem('bopomofo_volume_bgm', val);
  });

  sliderSfx.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valVolumeSfx.textContent = val;
    if (window.AudioManager) {
      window.AudioManager.setSFXVolume(val / 100);
    }
    localStorage.setItem('bopomofo_volume_sfx', val);
  });

  btnClearLeaderboard.addEventListener('click', () => {
    if (confirm('⚠️ 確定要清除所有的排行榜記錄嗎？此動作將無法還原！')) {
      localStorage.removeItem('bopomofo_leaderboard');
      renderLeaderboard();
      alert('已成功清除所有排行榜記錄。');
    }
  });

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
    renderSymbolTable();
    openModal(modalSymbols);
  });

  btnOpenLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
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

  // --- 鍵盤/電視遙控器快捷鍵監聽 ---
  window.addEventListener('keydown', (e) => {
    // 只有當遊戲進行畫面處於顯示狀態，且目前為活躍答題狀態時才處理
    if (screenGame.classList.contains('hidden') || !gameState.isActive) return;
    
    const key = e.key.toLowerCase();
    
    if (key === 'o' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // 阻止空白鍵造成網頁捲動
      judgeAnswer(true);
    } else if (key === 'x' || e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault();
      judgeAnswer(false);
    } else if (key === 's' || key === 'v' || key === 'p') {
      e.preventDefault();
      speakCurrentQuestion();
    }
  });

  // --- 初始化啟動 ---
  initSettings();

  // 暴露至全域方便除錯
  window.speakBopomofo = speakBopomofo;
  window.judgeAnswer = judgeAnswer;

  console.log('完整遊戲功能加載完成（包含鍵盤/遙控器支援）！');
});
