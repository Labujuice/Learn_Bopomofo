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
  const btnCounts = document.querySelectorAll('.btn-count');
  const btnModes = document.querySelectorAll('.btn-mode');
  let selectedQuestionCount = 10; // 預設 10 題
  let selectedGameMode = 'speak'; // 預設為說模式 ('speak' 或 'listen')
  
  const btnOpenSymbols = document.getElementById('btn-open-symbols');
  const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  
  const modalCloseBtns = document.querySelectorAll('.modal-close');
  
  const btnReplay = document.getElementById('btn-replay');
  const btnGoHome = document.getElementById('btn-go-home');
  const btnTtsGuide = document.getElementById('btn-tts-guide');
  const btnGameExit = document.getElementById('btn-game-exit');
  
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
  const listenOptionsContainer = document.getElementById('listen-options-container');
  const gameFooter = document.querySelector('.game-footer');
  
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
    isActive: false,
    gameMode: 'speak' // 'speak' 或 'listen'
  };

  // --- 語音合成 (TTS) v2.0 - 使用新的跨平台 TTS 引擎 ---
  // TTSEngine 已在 tts_engine.js 中初始化為 window.TTSEngine
  // Layer 1: 靜態音檔 (100% 跨平台一致, 台灣 Google TTS 口音)
  // Layer 2: Web Speech API 備援 (音檔缺失時使用)

  // 解鎖/預熱 iOS 音訊政策（需在使用者互動後呼叫）
  function primeTTS() {
    if (window.TTSEngine) {
      window.TTSEngine.prime();
    }
  }

  // 播放注音發音 (TTS) - 統一入口
  function speakBopomofo(syllable, toneObj) {
    if (window.TTSEngine) {
      // 同步音量設定
      if (window.AudioManager) {
        window.TTSEngine.setVolume(window.AudioManager.sfxVolume);
      }
      window.TTSEngine.speak(syllable, toneObj);
    } else {
      console.warn('[TTS] TTSEngine 尚未初始化');
    }
  }

  // --- 隨機姓名產生器 ---
  function getRandomPlayerName() {
    const data = window.BopomofoData;
    const adj = data.fruitAdjectives[Math.floor(Math.random() * data.fruitAdjectives.length)];
    const fruit = data.fruitNames[Math.floor(Math.random() * data.fruitNames.length)];
    return adj + fruit;
  }

  // --- 隨機出題生成器 ---
  function generateQuestionList(level, count = 10) {
    const questions = [];
    const data = window.BopomofoData;
    
    for (let i = 0; i < count; i++) {
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

  // --- 聽音選字選項生成與渲染 ---
  
  function generateDistractors(targetSyllable, level) {
    const data = window.BopomofoData;
    const distractors = [];
    let pool = [];
    
    if (level === 1) {
      pool = data.allSymbols;
    } else if (level === 2) {
      pool = data.twoPinyinList;
    } else if (level === 3) {
      pool = data.threePinyinList;
    } else if (level === 4) {
      pool = [...data.twoPinyinList, ...data.threePinyinList];
    }
    
    // 過濾掉與目標相同，以及在黑名單中的音
    const filteredPool = pool.filter(s => s !== targetSyllable && (!data.blacklist || !data.blacklist.includes(s)));
    
    // 隨機選取三個不重複的干擾項
    while (distractors.length < 3 && filteredPool.length > 0) {
      const idx = Math.floor(Math.random() * filteredPool.length);
      const item = filteredPool[idx];
      if (!distractors.includes(item)) {
        distractors.push(item);
        filteredPool.splice(idx, 1); // 避免重複選取
      }
    }
    
    // 防呆處理
    while (distractors.length < 3) {
      distractors.push(targetSyllable);
    }
    
    return distractors;
  }

  function renderListenOptions(q) {
    const data = window.BopomofoData;
    const distractors = generateDistractors(q.syllable, gameState.level);
    
    // 建立選項列表 (選項均共享與目標題目相同的聲調，測試注音字元辨識度)
    const optionsList = [q.syllable, ...distractors].map(s => {
      return { syllable: s, tone: q.tone, isCorrect: s === q.syllable };
    });
    
    // 隨機打亂選項順序 (Fisher-Yates Shuffle)
    for (let i = optionsList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsList[i], optionsList[j]] = [optionsList[j], optionsList[i]];
    }
    
    // 渲染
    listenOptionsContainer.innerHTML = '';
    optionsList.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn-option';
      
      const chars = opt.syllable.split('');
      const lenClass = `len-${chars.length}`;
      const charStackHtml = chars.map(c => `<span>${c}</span>`).join('');
      
      btn.innerHTML = `
        <div class="bopomofo-char-stack ${lenClass}">
          ${charStackHtml}
        </div>
        ${opt.tone.mark ? `<span class="bopomofo-tone ${opt.tone.class}">${opt.tone.mark}</span>` : ''}
      `;
      
      // 綁定點擊答題事件
      btn.addEventListener('click', () => {
        primeTTS();
        judgeAnswer(opt.isCorrect);
      });
      
      listenOptionsContainer.appendChild(btn);
    });
  }

  // --- 遊戲邏輯控制 ---

  function startNewGame(level) {
    let name = playerNameInput.value.trim();
    if (!name) {
      name = getRandomPlayerName();
    }
    
    // 儲存遊玩模式
    gameState.gameMode = selectedGameMode;
    
    gameState.playerName = name;
    gameState.level = level;
    gameState.score = 0;
    gameState.lives = 3;
    const countToGenerate = selectedQuestionCount === 'infinite' ? 1 : selectedQuestionCount;
    gameState.questions = generateQuestionList(level, countToGenerate);
    gameState.currentIndex = 0;
    gameState.correctCount = 0;
    gameState.isActive = true;
    
    gamePlayerName.textContent = name;
    gameScore.textContent = '0';
    updateHearts();
    
    // 依模式調整 UI 顯示狀態
    if (gameState.gameMode === 'listen') {
      // 聽音模式：隱藏底部手動評判按鈕，顯示選項區域，隱藏發音提示鈕
      gameFooter.classList.add('hidden');
      listenOptionsContainer.classList.remove('hidden');
      btnTtsGuide.classList.add('hidden');
      bopomofoDisplayBox.classList.add('speaker-mode');
    } else {
      // 說音模式：顯示底部評判按鈕，隱藏選項區域，顯示發音提示鈕
      gameFooter.classList.remove('hidden');
      listenOptionsContainer.classList.add('hidden');
      btnTtsGuide.classList.remove('hidden');
      bopomofoDisplayBox.classList.remove('speaker-mode');
    }
    
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
    if (selectedQuestionCount === 'infinite') {
      // 無限挑戰模式：動態生成新題目，確保不會越界
      if (gameState.currentIndex >= gameState.questions.length) {
        const nextQ = generateQuestionList(gameState.level, 1)[0];
        gameState.questions.push(nextQ);
      }
    } else {
      if (gameState.currentIndex >= gameState.questions.length) {
        endGame(true);
        return;
      }
    }
    
    const q = gameState.questions[gameState.currentIndex];
    if (selectedQuestionCount === 'infinite') {
      questionProgress.textContent = `第 ${gameState.currentIndex + 1} 題 (無限挑戰)`;
    } else {
      questionProgress.textContent = `第 ${gameState.currentIndex + 1} / ${gameState.questions.length} 題`;
    }
    
    if (gameState.gameMode === 'listen') {
      // 聽音模式：大盒子為播放器，不顯示注音符號
      bopomofoDisplayBox.innerHTML = '';
      
      // 生成 4 個選項並渲染
      renderListenOptions(q);
      
      // 聽音模式在出題時必須自動發音，讓小朋友聽
      speakCurrentQuestion();
    } else {
      // 說音模式：正常顯示注音符號
      const chars = q.syllable.split('');
      const lenClass = `len-${chars.length}`;
      const charStackHtml = chars.map(c => `<span>${c}</span>`).join('');
      
      bopomofoDisplayBox.innerHTML = `
        <div class="bopomofo-char-stack ${lenClass}">
          ${charStackHtml}
        </div>
        ${q.tone.mark ? `<span class="bopomofo-tone ${q.tone.class}">${q.tone.mark}</span>` : ''}
      `;
      
      // 說音模式不自動朗讀
      // speakCurrentQuestion();
    }
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
    const accuracyStr = selectedQuestionCount === 'infinite' ?
      `答對 ${gameState.correctCount} 題 (無限挑戰)` :
      `${gameState.correctCount} / ${gameState.questions.length}`;
    
    if (isWon) {
      finalScore += 10; // 通關紅利
      resultTitle.textContent = '恭喜通關！🎉';
      resultHeader.querySelector('.result-icon').textContent = '🏆';
    } else {
      resultTitle.textContent = '再接再厲！💪';
      resultHeader.querySelector('.result-icon').textContent = '😢';
    }
    
    resultPlayerName.textContent = gameState.playerName;
    resultLevel.textContent = `Lv.${gameState.level} (${gameState.gameMode === 'listen' ? '聽' : '說'})`;
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
    const accuracyStr = selectedQuestionCount === 'infinite' ?
      `答對 ${gameState.correctCount} 題 (無限)` :
      `${gameState.correctCount}/${gameState.questions.length}`;
      
    const newRecord = {
      name: gameState.playerName,
      level: gameState.level,
      gameMode: gameState.gameMode || 'speak',
      score: finalScore,
      accuracy: accuracyStr,
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
          primeTTS();
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
      const modeStr = r.gameMode === 'listen' ? '聽' : '說';
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>Lv.${r.level} (${modeStr})</td>
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
    
    // 初始化設定音量至音訊管理器與 TTS 引擎
    if (window.AudioManager) {
      window.AudioManager.setBGMVolume(bgmVolVal / 100);
      window.AudioManager.setSFXVolume(sfxVolVal / 100);
    }
    if (window.TTSEngine) {
      window.TTSEngine.setVolume(sfxVolVal / 100);
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
    // 同步更新 TTS 引擎音量
    if (window.TTSEngine) {
      window.TTSEngine.setVolume(val / 100);
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

  // 選擇遊戲模式按鈕事件
  btnModes.forEach(btn => {
    btn.addEventListener('click', () => {
      primeTTS();
      btnModes.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedGameMode = btn.getAttribute('data-mode');
    });
  });

  // 選擇題數按鈕事件
  btnCounts.forEach(btn => {
    btn.addEventListener('click', () => {
      primeTTS();
      btnCounts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const countVal = btn.getAttribute('data-count');
      selectedQuestionCount = countVal === 'infinite' ? 'infinite' : parseInt(countVal);
    });
  });

  // 選擇關卡開始遊戲
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      primeTTS();
      const level = parseInt(btn.getAttribute('data-level'));
      startNewGame(level);
    });
  });

  // 聽聽看按鈕
  btnTtsGuide.addEventListener('click', () => {
    primeTTS();
    speakCurrentQuestion();
  });

  // 點擊大注音區可重播聲音 (特別適用於聽力模式)
  bopomofoDisplayBox.addEventListener('click', () => {
    primeTTS();
    if (gameState.gameMode === 'listen') {
      speakCurrentQuestion();
    }
  });

  // 離開/強退按鈕
  btnGameExit.addEventListener('click', () => {
    if (confirm('確定要結束並結算目前這局遊戲嗎？')) {
      endGame(false);
    }
  });

  // 評判按鈕
  btnJudgeCorrect.addEventListener('click', () => judgeAnswer(true));
  btnJudgeWrong.addEventListener('click', () => judgeAnswer(false));

  // 結算畫面按鈕
  btnReplay.addEventListener('click', () => {
    primeTTS();
    startNewGame(gameState.level);
  });

  btnGoHome.addEventListener('click', () => {
    primeTTS();
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
