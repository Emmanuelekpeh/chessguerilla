// Global variables
let board = null; // Will hold the chessboard instance
let game = null;  // Will hold the chess.js instance
let currentPuzzle = null; // The current puzzle being solved
let puzzleIndex = 0; // Index of the current puzzle
let movesCount = 0; // Number of moves made in the current puzzle
let solvedCount = 0; // Number of puzzles solved
let isHintShown = false; // Flag to check if hint is shown

// Initialize the game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    loadPuzzle(puzzleIndex);
    updateStats();
    
    // Add event listeners
    document.getElementById('resetBtn').addEventListener('click', resetPuzzle);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('nextBtn').addEventListener('click', nextPuzzle);
});

// Initialize the chess game and board
function initGame() {
    game = new Chess();
    
    // Initialize the board with default settings
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    
    board = Chessboard('board', config);
    
    // Responsive board resize
    window.addEventListener('resize', board.resize);
}

// Check if it's user's turn to move
function onDragStart(source, piece) {
    // Do not pick up pieces if the game is over or it's not the user's turn
    if (game.game_over() || 
        (game.turn() === 'w' && currentPuzzle.orientation === 'black') ||
        (game.turn() === 'b' && currentPuzzle.orientation === 'white') ||
        (piece.search(currentPuzzle.orientation[0]) === -1)) {
        return false;
    }
    
    // Only allow the user to drag their own pieces
    if ((currentPuzzle.orientation === 'white' && piece.search(/^b/) !== -1) ||
        (currentPuzzle.orientation === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

// Handle the piece drop
function onDrop(source, target) {
    // Check if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });
    
    // If the move is illegal, return the piece to its original position
    if (move === null) return 'snapback';
    
    // Record the move
    const moveNotation = source + target;
    logMove(moveNotation, currentPuzzle.moves[movesCount] === moveNotation);
    
    // Check if the move is the expected one
    if (moveNotation === currentPuzzle.moves[movesCount]) {
        movesCount++;
        showMessage('Good move!', 'success');
        
        // If the puzzle is completed
        if (movesCount >= currentPuzzle.moves.length) {
            puzzleCompleted();
            return;
        }
        
        // Make the opponent's move after a short delay
        setTimeout(() => {
            makeOpponentMove();
        }, 500);
    } else {
        // Wrong move
        showMessage('Not the best move. Try again.', 'error');
        setTimeout(() => {
            game.undo();
            board.position(game.fen());
        }, 500);
        return 'snapback';
    }
}

// Update the board position after the piece snap animation
function onSnapEnd() {
    board.position(game.fen());
}

// Make the opponent's move automatically
function makeOpponentMove() {
    if (movesCount < currentPuzzle.moves.length) {
        const nextMove = currentPuzzle.moves[movesCount];
        const from = nextMove.substring(0, 2);
        const to = nextMove.substring(2, 4);
        
        game.move({
            from: from,
            to: to,
            promotion: 'q' // Always promote to a queen for simplicity
        });
        
        board.position(game.fen());
        logMove(nextMove, true, true);
        movesCount++;
        
        // If this was the last move
        if (movesCount >= currentPuzzle.moves.length) {
            puzzleCompleted();
        }
    }
}

// Load a puzzle by index
function loadPuzzle(index) {
    if (index < 0 || index >= chessPuzzles.length) {
        showMessage('No more puzzles available!', 'info');
        return false;
    }
    
    // Reset variables
    movesCount = 0;
    isHintShown = false;
    
    // Get the puzzle
    currentPuzzle = chessPuzzles[index];
    
    // Set up the game
    game = new Chess(currentPuzzle.fen);
    
    // Update the board
    board.orientation(currentPuzzle.orientation);
    board.position(game.fen());
    
    // Update UI
    document.getElementById('puzzleId').textContent = currentPuzzle.id;
    document.getElementById('puzzleDifficulty').textContent = `Difficulty: ${currentPuzzle.difficulty}`;
    document.getElementById('puzzleObjective').textContent = `Objective: ${currentPuzzle.objective}`;
    
    // Clear moves list
    document.getElementById('movesList').innerHTML = '';
    
    // Clear message box
    clearMessage();
    
    // If it's the opponent's turn first, make their move
    if ((game.turn() === 'w' && currentPuzzle.orientation === 'black') ||
        (game.turn() === 'b' && currentPuzzle.orientation === 'white')) {
        setTimeout(() => {
            makeOpponentMove();
        }, 1000);
    }
    
    return true;
}

// Show a hint by highlighting the correct move
function showHint() {
    if (isHintShown || movesCount >= currentPuzzle.moves.length) return;
    
    const nextMove = currentPuzzle.moves[movesCount];
    const from = nextMove.substring(0, 2);
    const to = nextMove.substring(2, 4);
    
    // Highlight the correct move
    board.highlightSquare(from, 'highlight-from');
    board.highlightSquare(to, 'highlight-to');
    
    // Add hint text in the message box
    showMessage(`Try moving from ${from} to ${to}`, 'info');
    
    isHintShown = true;
}

// Add square highlighting support to chessboard.js
Chessboard.prototype.highlightSquare = function(square, className) {
    // Remove any existing highlights
    const highlightElements = document.querySelectorAll('.highlight-from, .highlight-to');
    highlightElements.forEach(el => el.classList.remove('highlight-from', 'highlight-to'));
    
    // Add highlight to the specified square
    const squareElement = document.querySelector(`.square-${square}`);
    if (squareElement) {
        squareElement.classList.add(className);
    }
    
    // Clear the highlight after 3 seconds
    setTimeout(() => {
        if (squareElement) {
            squareElement.classList.remove(className);
        }
    }, 3000);
};

// Reset the current puzzle
function resetPuzzle() {
    loadPuzzle(puzzleIndex);
}

// Move to the next puzzle
function nextPuzzle() {
    puzzleIndex = (puzzleIndex + 1) % chessPuzzles.length;
    loadPuzzle(puzzleIndex);
    updateStats();
}

// Log a move in the moves list
function logMove(moveNotation, isCorrect, isOpponent = false) {
    const movesList = document.getElementById('movesList');
    const moveItem = document.createElement('div');
    moveItem.classList.add('move-item');
    
    // Format the move
    let formattedMove = formatChessNotation(moveNotation);
    if (isOpponent) formattedMove = `Opponent: ${formattedMove}`;
    else formattedMove = `You: ${formattedMove}`;
    
    if (isCorrect) {
        moveItem.classList.add('correct-move');
    } else {
        moveItem.classList.add('wrong-move');
        formattedMove += ' ❌';
    }
    
    moveItem.textContent = formattedMove;
    movesList.appendChild(moveItem);
    movesList.scrollTop = movesList.scrollHeight;
}

// Format move notation for display
function formatChessNotation(notation) {
    const from = notation.substring(0, 2);
    const to = notation.substring(2, 4);
    return `${from} → ${to}`;
}

// Handle puzzle completion
function puzzleCompleted() {
    solvedCount++;
    updateStats();
    showMessage('Puzzle solved! Well done! 🎉', 'success');
    
    // Display the explanation
    setTimeout(() => {
        showMessage(`Key idea: ${currentPuzzle.explanation}`, 'info');
    }, 2000);
}

// Update statistics
function updateStats() {
    document.getElementById('solvedCount').textContent = solvedCount;
    document.getElementById('remainingCount').textContent = chessPuzzles.length - solvedCount;
}

// Show a message in the message box
function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.className = 'message-box ' + type;
}

// Clear the message box
function clearMessage() {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = '';
    messageBox.className = 'message-box';
}

// Additional functions for puzzle generation system
// Function to load puzzles from API
async function fetchPuzzles(difficulty = 'medium', count = 5) {
    showLoading(true);
    try {
        const response = await fetch('/api/puzzles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ difficulty, count })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch puzzles');
        }
        
        const data = await response.json();
        
        // Replace the static puzzles with the fetched ones
        if (data.puzzles && data.puzzles.length > 0) {
            // Merge with existing puzzles or replace them
            chessPuzzles.push(...data.puzzles);
            showMessage('New puzzles loaded!', 'info');
        }
    } catch (error) {
        console.error('Error fetching puzzles:', error);
        showMessage('Failed to load new puzzles. Using existing ones.', 'error');
    } finally {
        showLoading(false);
    }
}

// Add loading indicator functions
function showLoading(isLoading) {
    const messageBox = document.getElementById('messageBox');
    
    if (isLoading) {
        messageBox.innerHTML = '<div class="loading-spinner"></div> Loading puzzles...';
        messageBox.className = 'message-box info';
    } else {
        clearMessage();
    }
}
