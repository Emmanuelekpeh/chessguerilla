// Import CSS - comment these out if causing issues
// You can add them as <link> tags in index.html instead
// import '../css/styles.css';
// import '../css/chessboard-1.0.0.min.css';

// Import the ChessGuerilla class
import { ChessGuerilla } from './chessGuerilla';

document.addEventListener('DOMContentLoaded', () => {
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
});
