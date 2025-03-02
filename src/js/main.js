// Import the ChessGuerilla class
import { ChessGuerilla } from './chessGuerilla';

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for external dependencies to be ready
  if (typeof Chess === 'undefined' || typeof Chessboard === 'undefined' || typeof $ === 'undefined') {
    console.error('Required external dependencies not loaded. Please check script tags.');
    return;
  }

  try {
    // Create ChessGuerilla instance with options
    const chessGuerilla = new ChessGuerilla({
      userId: localStorage.getItem('chessguerilla_user') || `guest-${Date.now().toString(36)}`,
      includeTraps: true,
      useLocalStorage: true,
      difficulty: 'adaptive'
    });

    // Initialize the chess board
    chessGuerilla.initializeBoard('board', {
      pieceTheme: 'img/chesspieces/wikipedia/{piece}.png'
    });

    // Set up report button
    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        chessGuerilla.showPerformanceReport();
      });
    }

    // Set username display
    const usernameEl = document.getElementById('username');
    if (usernameEl) {
      usernameEl.textContent = chessGuerilla.options.userId.replace('guest-', '');
    }
  } catch (error) {
    console.error('Error initializing ChessGuerilla:', error);
    document.getElementById('messageBox').textContent = 'Error loading application. Please check console.';
    document.getElementById('messageBox').className = 'message-box error';
  }
});
