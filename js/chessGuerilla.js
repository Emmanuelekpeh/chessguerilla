/**
 * ChessGuerilla - Educational Chess Puzzle System
 * Version: 1.0.0
 * Date: 2025-03-02
 * 
 * This system helps chess players improve by providing educational puzzles
 * with skill tracking, trap detection, and progressive learning paths.
 */

// Import required modules (if in Node.js environment)
// In browser, these would be included via script tags
if (typeof module !== 'undefined' && module.exports) {
    const { PuzzleCore } = require('./core/puzzleCore');
    const { PuzzleTraps } = require('./puzzleTraps');
    const { PuzzleGenerator } = require('./education/puzzleGenerator');
    const { SkillTracker } = require('./education/skillTracker');
    const { UserSkillProfile } = require('./education/userSkillProfile');
    const Chess = require('chess.js').Chess;
}

/**
 * Main ChessGuerilla Controller Class
 */
class ChessGuerilla {
    constructor(options = {}) {
        // Parse options
        this.options = {
            userId: 'guest-' + Math.random().toString(36).substring(2, 9),
            includeTraps: true,
            useLocalStorage: true,
            difficulty: 'adaptive', // 'adaptive', 'easy', 'medium', 'hard', 'expert'
            ...options
        };
        
        // Initialize components
        this.puzzleCore = new PuzzleCore();
        this.puzzleGenerator = new PuzzleGenerator({
            includeTraps: this.options.includeTraps
        });
        this.skillTracker = new SkillTracker(this.options.userId);
        
        // Track user session
        this.sessionStats = {
            startTime: new Date(),
            puzzlesSolved: 0,
            puzzlesFailed: 0,
            totalTime: 0,
            hintsUsed: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastPuzzleStartTime: null
        };
        
        // Load user data if available
        if (this.options.useLocalStorage) {
            this.loadUserData();
        }
    }
    
    /**
     * Initialize the chess board UI
     * @param {string} boardContainerId - DOM ID for the chess board container
     * @param {Object} boardConfig - Configuration for the chessboard
     */
    initializeBoard(boardContainerId, boardConfig = {}) {
        // Default board configuration
        const config = {
            draggable: true,
            position: 'start',
            pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
            orientation: 'white',
            onDragStart: this.onDragStart.bind(this),
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            ...boardConfig
        };
        
        // Initialize the chessboard
        this.board = Chessboard(boardContainerId, config);
        
        // Set the board size responsively
        this.resizeBoard();
        window.addEventListener('resize', this.resizeBoard.bind(this));
        
        // Attach event listeners for UI controls
        this.attachEventListeners();
        
        // Start with a new puzzle
        this.startNewPuzzle();
    }
    
    /**
     * Resize the chess board to fit the container
     */
    resizeBoard() {
        const board = document.getElementById(this.board.containerElId);
        if (!board) return;
        
        const container = board.parentElement;
        const containerWidth = container.offsetWidth;
        const idealSize = Math.min(containerWidth, window.innerHeight * 0.7);
        
        board.style.width = `${idealSize}px`;
        board.style.height = `${idealSize}px`;
        
        // Trigger board resize if Chessboard.js has this method
        if (this.board.resize) {
            this.board.resize();
        }
    }
    
    /**
     * Attach event listeners for UI controls
     */
    attachEventListeners() {
        // New Puzzle button
        const newPuzzleBtn = document.getElementById('newPuzzleBtn');
        if (newPuzzleBtn) {
            newPuzzleBtn.addEventListener('click', () => this.startNewPuzzle());
        }
        
        // Reset Puzzle button
        const resetPuzzleBtn = document.getElementById('resetPuzzleBtn');
        if (resetPuzzleBtn) {
            resetPuzzleBtn.addEventListener('click', () => this.resetCurrentPuzzle());
        }
        
        // Hint button
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }
        
        // Solution button
        const solutionBtn = document.getElementById('solutionBtn');
        if (solutionBtn) {
            solutionBtn.addEventListener('click', () => this.showSolution());
        }
        
        // Difficulty selector
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.options.difficulty = e.target.value;
                this.startNewPuzzle();
            });
        }
        
        // Theme selector
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.options.theme = e.target.value;
                this.startNewPuzzle();
            });
        }
        
        // Trap toggle
        const trapToggle = document.getElementById('trapToggle');
        if (trapToggle) {
            trapToggle.addEventListener('change', (e) => {
                this.puzzleGenerator.setTrapGeneration(e.target.checked);
                this.updateUI();
            });
        }
    }
    
    /**
     * Start a new puzzle
     */
    startNewPuzzle() {
        // End current session timing if applicable
        if (this.sessionStats.lastPuzzleStartTime) {
            const puzzleTime = (new Date() - this.sessionStats.lastPuzzleStartTime) / 1000;
            this.sessionStats.totalTime += puzzleTime;
        }
        
        // Get puzzle difficulty based on user skill or selected option
        let difficulty = this.options.difficulty;
        
        if (difficulty === 'adaptive') {
            const rating = this.skillTracker.skillProfile.ratings.overall;
            if (rating < 1200) difficulty = 'easy';
            else if (rating < 1500) difficulty = 'medium';
            else if (rating < 1800) difficulty = 'hard';
            else difficulty = 'expert';
        }
        
        // Get recommended themes from skill tracker
        const recommendedThemes = this.skillTracker.skillProfile.getRecommendedThemes(1);
        const theme = recommendedThemes[0] || this.options.theme || null;
        
        // Generate a new puzzle
        const puzzle = this.puzzleGenerator.generatePuzzle(
            theme, 
            difficulty, 
            this.puzzleGenerator.options.includeTraps
        );
        
        // Initialize the puzzle on the board
        const boardState = this.puzzleCore.initializePuzzle(puzzle);
        
        // Update the board position
        this.board.position(boardState.position);
        
        // Set the board orientation
        this.board.orientation(puzzle.orientation);
        
        // Reset puzzle-specific stats
        this.sessionStats.lastPuzzleStartTime = new Date();
        this.sessionStats.currentPuzzleHints = 0;
        
        // Update UI with puzzle details
        this.updateUI();
    }
    
    /**
     * Reset the current puzzle
     */
    resetCurrentPuzzle() {
        const boardState = this.puzzleCore.resetPuzzle();
        if (!boardState) return;
        
        this.board.position(boardState.position);
        this.sessionStats.currentPuzzleHints = 0;
        
        this.updateUI();
    }
    
    /**
     * Handle piece drag start event
     * @param {string} source - Source square
     * @param {string} piece - Piece type
     * @param {Object} position - Current board position
     * @param {string} orientation - Board orientation
     */
    onDragStart(source, piece, position, orientation) {
        // Prevent dragging if no puzzle is active
        if (!this.puzzleCore.currentPuzzle) return false;
        
        // Get current player color from puzzle orientation
        const playerColor = this.puzzleCore.currentPuzzle.orientation.charAt(0);
        
        // Only allow player to move their own pieces
        if ((playerColor === 'w' && piece.search(/^b/) !== -1) ||
            (playerColor === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        
        // Prevent dragging if it's not the player's turn
        const turn = this.puzzleCore.chessEngine.turn();
        if ((turn === 'w' && piece.search(/^b/) !== -1) ||
            (turn === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Handle piece drop event
     * @param {string} source - Source square
     * @param {string} target - Target square
     * @param {string} piece - Piece type
     */
    onDrop(source, target, piece) {
        // Check for pawn promotion
        let promotion = undefined;
        
        if ((piece === 'wP' && target[1] === '8') ||
            (piece === 'bP' && target[1] === '1')) {
            promotion = 'q'; // Default to queen promotion
            
            // In a real app, we'd show a promotion dialog here
            // For now, we'll just promote to a queen automatically
        }
        
        // Evaluate the move
        const moveResult = this.puzzleCore.evaluateMove(source, target, promotion);
        
        if (!moveResult || !moveResult.valid) {
            // Invalid move, return piece to source square
            return 'snapback';
        }
        
        // Update the board with the opponent's move if one was made
        if (moveResult.opponentMove) {
            setTimeout(() => {
                this.board.position(moveResult.position);
            }, 300);
        }
        
        // Handle puzzle completion
        if (moveResult.completed) {
            this.handlePuzzleCompleted(true);
        }
        
        // Handle incorrect moves
        if (!moveResult.isCorrect && !moveResult.isTrap) {
            this.showMessage("Try again. That's not the best move.", "error");
            return 'snapback';
        }
        
        // Handle trap moves
        if (moveResult.isTrap) {
            const trapInfo = moveResult.trapInfo;
            this.showMessage(`You fell for the ${trapInfo.name} trap!`, "warning");
            
            // After a delay, show explanation and reset
            setTimeout(() => {
                this.showMessage(trapInfo.explanation, "info");
                setTimeout(() => this.resetCurrentPuzzle(), 3000);
            }, 1500);
            
            // Update skill tracking with trap move data
            this.handlePuzzleCompleted(false, true);
        }
        
        // Update UI with the latest information
        this.updateUI();
        
        return undefined; // Allow the move
    }
    
    /**
     * Handle post-move animation completion
     */
    onSnapEnd() {
        // Make sure the board shows the current position
        if (this.puzzleCore.currentPuzzle) {
            this.board.position(this.puzzleCore.chessEngine.fen());
        }
    }
    
    /**
     * Handle puzzle completion
     * @param {boolean} success - Whether the puzzle was solved successfully
     * @param {boolean} isTrap - Whether the user fell for a trap
     */
    handlePuzzleCompleted(success, isTrap = false) {
        // Calculate time spent on puzzle
        const timeSpent = (new Date() - this.sessionStats.lastPuzzleStartTime) / 1000;
        
        // Update session stats
        if (success) {
            this.sessionStats.puzzlesSolved++;
            this.sessionStats.currentStreak++;
            this.sessionStats.bestStreak = Math.max(
                this.sessionStats.bestStreak,
                this.sessionStats.currentStreak
            );
            
            this.showMessage("Puzzle solved correctly!", "success");
        } else {
            this.sessionStats.puzzlesFailed++;
            this.sessionStats.currentStreak = 0;
            
            if (isTrap) {
                this.showMessage("You fell for a trap! Learning opportunity!", "warning");
            } else {
                this.showMessage("Puzzle not solved correctly.", "error");
            }
        }
        
        // Update the skill tracker
        const hintsUsed = this.sessionStats.currentPuzzleHints || 0;
        const result = this.skillTracker.updateAfterPuzzle(
            this.puzzleCore.currentPuzzle,
            success,
            timeSpent,
            hintsUsed
        );
        
        // Save user data
        if (this.options.useLocalStorage) {
            this.saveUserData();
        }
        
        // Show achievements or milestone progress
        if (result.achievedMilestones.length > 0) {
            const milestone = result.achievedMilestones[0];
            setTimeout(() => {
                this.showAchievement(milestone.title, milestone.description);
            }, 1000);
        }
        
        // Show lesson completion
        if (result.lessonCompleted) {
            setTimeout(() => {
                this.showMessage(`Lesson completed: ${result.nextLesson.title}`, "success");
            }, 2000);
        }
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Show a hint for the current puzzle
     */
    showHint() {
        const hint = this.puzzleCore.getHint();
        if (!hint) return;
        
        this.showMessage(hint.message, "info");
        
        // Highlight the relevant squares
        if (hint.highlightSquares && hint.highlightSquares.length > 0) {
            this.highlightSquares(hint.highlightSquares);
        }
        
        // Track hint usage
        this.sessionStats.hintsUsed++;
        this.sessionStats.currentPuzzleHints = (this.sessionStats.currentPuzzleHints || 0) + 1;
    }
    
    /**
     * Highlight squares on the board
     * @param {Array} squares - Array of square names to highlight
     */
    highlightSquares(squares) {
        // Remove any existing highlights
        const highlightClass = 'highlight-square';
        document.querySelectorAll(`.${highlightClass}`).forEach(el => {
            el.classList.remove(highlightClass);
        });
        
        // Add highlights to the specified squares
        squares.forEach(square => {
            const squareEl = document.querySelector(`.square-${square}`);
            if (squareEl) {
                squareEl.classList.add(highlightClass);
            }
        });
        
        // Remove highlights after a delay
        setTimeout(() => {
            document.querySelectorAll(`.${highlightClass}`).forEach(el => {
                el.classList.remove(highlightClass);
            });
        }, 3000);
    }
    
    /**
     * Show the solution for the current puzzle
     */
    showSolution() {
        if (!this.puzzleCore.currentPuzzle) return;
        
        const explanation = this.puzzleCore.getPuzzleExplanation();
        this.showMessage(`Solution: ${explanation.explanation}`, "info");
        
        // Mark puzzle as failed when solution is shown
        this.handlePuzzleCompleted(false);
        
        // Show full solution moves after a delay
        setTimeout(() => {
            const movesList = this.puzzleCore.currentPuzzle.moves.join(', ');
            this.showMessage(`Correct sequence: ${movesList}`, "info");
        }, 2000);
    }
    
    /**
     * Show a message in the UI
     * @param {string} message - The message to display
     * @param {string} type - Message type (success, error, info, warning)
     */
    showMessage(message, type = "info") {
        const messageBox = document.getElementById('messageBox');
        if (!messageBox) return;
        
        // Set message content and type
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        
        // Make sure the message box is visible
        messageBox.style.display = 'block';
        
        // Clear the message after a delay for certain types
        if (type === "success" || type === "error") {
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }
    
    /**
     * Show an achievement notification
     * @param {string} title - Achievement title
     * @param {string} description - Achievement description
     */
    showAchievement(title, description) {
        // Create achievement notification element if it doesn't exist
        let achievementEl = document.getElementById('achievement-notification');
        
        if (!achievementEl) {
            achievementEl = document.createElement('div');
            achievementEl.id = 'achievement-notification';
            document.body.appendChild(achievementEl);
        }
        
        // Set achievement content
        achievementEl.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
        
        // Show the achievement
        achievementEl.classList.add('show');
        
        // Hide after a delay
        setTimeout(() => {
            achievementEl.classList.remove('show');
        }, 5000);
    }
    
    /**
     * Update UI elements with the latest game state
     */
        updateUI() {
        // Update puzzle info
        const puzzleInfoEl = document.getElementById('puzzle-info');
        if (puzzleInfoEl && this.puzzleCore.currentPuzzle) {
            const puzzle = this.puzzleCore.currentPuzzle;
            puzzleInfoEl.innerHTML = `
                <div class="puzzle-theme">${puzzle.theme || 'General Tactics'}</div>
                <div class="puzzle-difficulty">${puzzle.difficulty || 'Medium'}</div>
                <div class="puzzle-objective">${puzzle.objective || 'Find the best move'}</div>
            `;
        }
        
        // Update stats display
        const statsEl = document.getElementById('stats-display');
        if (statsEl) {
            const rating = this.skillTracker.skillProfile.ratings.overall;
            statsEl.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Rating:</span>
                    <span class="stat-value">${rating}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Solved:</span>
                    <span class="stat-value">${this.sessionStats.puzzlesSolved}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Streak:</span>
                    <span class="stat-value">${this.sessionStats.currentStreak}</span>
                </div>
            `;
        }
        
        // Update trap toggle state
        const trapToggle = document.getElementById('trapToggle');
        if (trapToggle) {
            trapToggle.checked = this.puzzleGenerator.options.includeTraps;
        }
        
        // Update difficulty selector
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.value = this.options.difficulty;
        }
    }
    
    /**
     * Save user data to local storage
     */
    saveUserData() {
        if (!window.localStorage) return;
        
        try {
            // Save skill profile
            const userProgress = this.skillTracker.exportUserProgress();
            localStorage.setItem(`chess_guerilla_progress_${this.options.userId}`, userProgress);
            
            // Save session stats
            localStorage.setItem(`chess_guerilla_stats_${this.options.userId}`, JSON.stringify(this.sessionStats));
            
            // Save options
            localStorage.setItem(`chess_guerilla_options_${this.options.userId}`, JSON.stringify(this.options));
        } catch (e) {
            console.error("Error saving user data:", e);
        }
    }
    
    /**
     * Load user data from local storage
     */
    loadUserData() {
        if (!window.localStorage) return;
        
        try {
            // Load skill profile
            const userProgress = localStorage.getItem(`chess_guerilla_progress_${this.options.userId}`);
            if (userProgress) {
                this.skillTracker.importUserProgress(userProgress);
            }
            
            // Load session stats
            const statsJson = localStorage.getItem(`chess_guerilla_stats_${this.options.userId}`);
            if (statsJson) {
                const savedStats = JSON.parse(statsJson);
                // Only copy specific properties to maintain session integrity
                this.sessionStats.puzzlesSolved = savedStats.puzzlesSolved || 0;
                this.sessionStats.puzzlesFailed = savedStats.puzzlesFailed || 0;
                this.sessionStats.bestStreak = savedStats.bestStreak || 0;
                this.sessionStats.hintsUsed = savedStats.hintsUsed || 0;
            }
            
            // Load options
            const optionsJson = localStorage.getItem(`chess_guerilla_options_${this.options.userId}`);
            if (optionsJson) {
                const savedOptions = JSON.parse(optionsJson);
                // Merge saved options with defaults
                this.options = { ...this.options, ...savedOptions };
                // Apply loaded options
                this.puzzleGenerator.setTrapGeneration(this.options.includeTraps);
            }
        } catch (e) {
            console.error("Error loading user data:", e);
        }
    }
    
    /**
     * Generate a performance report
     */
    generateReport() {
        const summary = this.skillTracker.getPerformanceSummary();
        const puzzleStats = this.puzzleCore.getPuzzleStats();
        
        return {
            username: this.options.userId,
            currentRating: summary.ratings.overall,
            strengthThemes: summary.strengthThemes,
            weaknessThemes: summary.weaknessThemes,
            puzzlesSolved: puzzleStats.solved,
            totalAttempts: puzzleStats.total,
            successRate: puzzleStats.total > 0 ? 
                (puzzleStats.solved / puzzleStats.total * 100).toFixed(1) + '%' : '0%',
            bestStreak: this.sessionStats.bestStreak,
            currentLevel: summary.currentLevel,
            nextLevelProgress: summary.nextLevelProgress,
            achievedMilestones: summary.achievedMilestones,
            nextMilestone: summary.nextMilestone,
            recommendedFocus: summary.recommendedFocus
        };
    }
    
    /**
     * Display a performance report in the UI
     */
    showPerformanceReport() {
        const report = this.generateReport();
        
        // Create a modal for the report
        const modalHtml = `
            <div class="report-modal">
                <div class="report-modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Chess Performance Report</h2>
                    <div class="report-section">
                        <h3>Rating: ${report.currentRating}</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${report.nextLevelProgress};"></div>
                        </div>
                        <p>Progress to ${report.nextMilestone ? report.nextMilestone.title : 'next level'}: ${report.nextLevelProgress}</p>
                    </div>
                    <div class="report-section">
                        <h3>Strengths</h3>
                        <ul>
                            ${report.strengthThemes.map(theme => `<li>${theme}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="report-section">
                        <h3>Areas for Improvement</h3>
                        <ul>
                            ${report.weaknessThemes.map(theme => `<li>${theme}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="report-section">
                        <h3>Statistics</h3>
                        <table>
                            <tr><td>Puzzles Solved:</td><td>${report.puzzlesSolved}</td></tr>
                            <tr><td>Success Rate:</td><td>${report.successRate}</td></tr>
                            <tr><td>Best Streak:</td><td>${report.bestStreak}</td></tr>
                        </table>
                    </div>
                    <div class="report-section">
                        <h3>Recommendation</h3>
                        <p>Focus on: <strong>${report.recommendedFocus}</strong></p>
                    </div>
                    <button class="share-report-btn">Share Report</button>
                </div>
            </div>
        `;
        
        // Create the modal element
        const modalEl = document.createElement('div');
        modalEl.innerHTML = modalHtml;
        document.body.appendChild(modalEl);
        
        // Add event listeners for the modal
        const modal = modalEl.querySelector('.report-modal');
        const closeBtn = modalEl.querySelector('.close-button');
        const shareBtn = modalEl.querySelector('.share-report-btn');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalEl);
        });
        
        shareBtn.addEventListener('click', () => {
            this.shareReport(report);
        });
        
        // Close modal if clicked outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modalEl);
            }
        });
    }
    
    /**
     * Share performance report
     */
    shareReport(report) {
        // Create shareable text
        const shareText = `
My ChessGuerilla Report:
Rating: ${report.currentRating}
Strengths: ${report.strengthThemes.join(', ')}
Areas to improve: ${report.weaknessThemes.join(', ')}
Puzzles solved: ${report.puzzlesSolved}
Success rate: ${report.successRate}
#ChessGuerilla
        `.trim();
        
        // Check if Web Share API is supported
        if (navigator.share) {
            navigator.share({
                title: 'My ChessGuerilla Performance Report',
                text: shareText,
                url: window.location.href
            })
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    this.showMessage('Report copied to clipboard!', 'success');
                })
                .catch(error => {
                    console.error('Error copying report:', error);
                    this.showMessage('Could not copy report to clipboard.', 'error');
                    
                    // Show in a textarea as last resort
                    const textarea = document.createElement('textarea');
                    textarea.value = shareText;
                    textarea.style.position = 'fixed';
                    textarea.style.left = '0';
                    textarea.style.top = '0';
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                });
        }
    }
    
    /**
     * Does the system generate traps?
     */
    doesSystemGenerateTraps() {
        return this.puzzleGenerator.doesSystemGenerateTraps();
    }
    
    /**
     * Set trap generation
     */
    setTrapGeneration(enable) {
        const result = this.puzzleGenerator.setTrapGeneration(enable);
        this.options.includeTraps = result;
        this.saveUserData();
        return result;
    }
}

// Export the ChessGuerilla class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessGuerilla };
} else {
    // Make it available globally in browser environments
    window.ChessGuerilla = ChessGuerilla;
}
