// ㄅㄆㄇㄈ 發音出題機 - 核心邏輯與頁面路由

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
    // 稍後會實作渲染注音符號表的邏輯
  });

  btnOpenLeaderboard.addEventListener('click', () => {
    openModal(modalLeaderboard);
    // 稍後會實作讀取排行榜的邏輯
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
      
      // 如果未輸入名字，隨機選取水果名 (在步驟 6 中實作，目前用 placeholder)
      if (!playerName) {
        playerName = '隨機小夥伴';
      }
      
      console.log(`開始遊戲！玩家: ${playerName}, 關卡: Lv.${selectedLevel}`);
      
      // 進入遊戲畫面的模擬邏輯
      document.getElementById('game-player-name').textContent = playerName;
      showScreen(screenGame);
    });
  });

  // 結算畫面按鈕
  btnReplay.addEventListener('click', () => {
    console.log('重新挑戰遊戲');
    showScreen(screenGame);
  });

  btnGoHome.addEventListener('click', () => {
    console.log('返回主選單');
    showScreen(screenMainMenu);
  });

  console.log('頁面路由與基礎事件監聽器載入完成！');
});
