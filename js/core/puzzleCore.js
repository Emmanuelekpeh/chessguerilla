/**
 * Chess Puzzle Core System
 * Handles basic puzzle generation, validation and display
 */

class PuzzleCore {
    constructor() {
        this.currentPuzzle = null;
        this.puzzleHistory = [];
        this.moveHistory = [];
        this.isEvaluating = false;
        this.chessEngine = new Chess(); // chess.js instance
    }
    
    /**
     * Initialize a puzzle on the board
     */
    initializePuzzle(puzzle) {
        this.currentPuzzle = puzzle;
        this.moveHistory = [];
        this.isEvaluating = false;
        
        // Reset the chess engine with the puzzle position
        this.chessEngine.load(puzzle.fen);
        
        // Return position for the UI to display
        return {
            position: puzzle.fen,
            orientation: puzzle.orientation,
            turn: this.chessEngine.turn()
        };
    }
    
    /**
     * Evaluate a user move in the current puzzle
     */
    evaluateMove(from, to, promotion = 'q') {
        if (!this.currentPuzzle || this.isEvaluating) return null;
        
        this.isEvaluating = true;
        
        // Try to make the move
        const move = this.chessEngine.move({
            from: from,
            to: to,
            promotion: promotion
        });
        
        // If move is illegal
        if (!move) {
            this.isEvaluating = false;
            return { 
                valid: false, 
                message: "Illegal move" 
            };
        }
        
        // Format move in our standard notation
        const moveNotation = from + to + (promotion || '');
        
        // Record the move
        this.moveHistory.push(moveNotation);
        
        // Check if the move matches the expected one in the puzzle
        const expectedMove = this.currentPuzzle.moves[this.moveHistory.length - 1];
        const isCorrect = moveNotation === expectedMove;
        
        // Check if move is a known trap
        let trapInfo = null;
        if (this.currentPuzzle.hasTrap && this.currentPuzzle.trapInfo) {
            if (moveNotation === this.currentPuzzle.trapInfo.trapMove) {
                trapInfo = this.currentPuzzle.trapInfo;
            }
        }
        
        // Check for alternative paths
        let alternativePath = null;
        if (this.currentPuzzle.alternativePaths) {
            alternativePath = this.currentPuzzle.alternativePaths.find(
                path => path.move === moveNotation
            );
        }
        
        // Prepare result
        const result = {
            valid: true,
            isCorrect: isCorrect,
            isTrap: !!trapInfo,
            trapInfo: trapInfo,
            alternativePath: alternativePath,
            position: this.chessEngine.fen(),
            move: move,
            gameOver: this.chessEngine.game_over(),
        };
        
        // If correct move and puzzle is completed
        if (isCorrect && this.moveHistory.length >= this.currentPuzzle.moves.length) {
            result.completed = true;
            result.message = "Puzzle solved correctly!";
            this.puzzleHistory.push({
                id: this.currentPuzzle.id,
                result: "solved",
                moves: [...this.moveHistory],
                timestamp: new Date()
            });
        }
        // If correct move but puzzle continues
        else if (isCorrect) {
            result.message = "Correct move! Continue...";
            
            // Make the opponent's move automatically
            if (this.moveHistory.length < this.currentPuzzle.moves.length) {
                const nextMove = this.currentPuzzle.moves[this.moveHistory.length];
                
                // Parse the next move
                const nextFrom = nextMove.substring(0, 2);
                const nextTo = nextMove.substring(2, 4);
                const nextPromotion = nextMove.length > 4 ? nextMove.substring(4) : undefined;
                
                // Make opponent move
                const opponentMove = this.chessEngine.move({
                    from: nextFrom,
                    to: nextTo,
                    promotion: nextPromotion
                });
                
                // Record the opponent's move
                this.moveHistory.push(nextMove);
                
                result.opponentMove = opponentMove;
                result.position = this.chessEngine.fen(); // Update position after opponent moves
            }
        }
        // If incorrect move (but not a trap)
        else if (!trapInfo) {
            result.message = "Not the best move. Try again.";
            
            // Undo the move in the engine to allow retrying
            this.chessEngine.undo();
            this.moveHistory.pop();
        }
        // If it's a trap move
        else {
            result.message = `You fell for the ${trapInfo.name} trap!`;
        }
        
        this.isEvaluating = false;
        return result;
    }
    
    /**
     * Reset the current puzzle
     */
    resetPuzzle() {
        if (!this.currentPuzzle) return null;
        
        return this.initializePuzzle(this.currentPuzzle);
    }
    
    /**
     * Get a hint for the current puzzle
     */
    /**
     * Get a hint for the current puzzle
     */
    getHint() {
        if (!this.currentPuzzle) return null;
        
        // Get the expected move at the current position
        const expectedMoveIndex = this.moveHistory.length;
        if (expectedMoveIndex >= this.currentPuzzle.moves.length) {
            return {
                type: "info",
                message: "You've completed all the moves for this puzzle!"
            };
        }
        
        const expectedMove = this.currentPuzzle.moves[expectedMoveIndex];
        const fromSquare = expectedMove.substring(0, 2);
        const toSquare = expectedMove.substring(2, 4);
        
        // Check what piece is being moved
        const piece = this.chessEngine.get(fromSquare);
        if (!piece) {
            return {
                type: "error",
                message: "Hint error: Could not find piece at expected position"
            };
        }
        
        // Create hints of increasing specificity
        const hints = [
            {
                type: "vague",
                message: `Look for a move with your ${this.getPieceName(piece.type)}.`,
                highlightSquares: []
            },
            {
                type: "moderate",
                message: `Consider moving a piece from the ${this.getSquareDescription(fromSquare)} area.`,
                highlightSquares: [fromSquare]
            },
            {
                type: "specific",
                message: `Try moving your ${this.getPieceName(piece.type)} from ${fromSquare} to ${toSquare}.`,
                highlightSquares: [fromSquare, toSquare]
            }
        ];
        
        // Determine which hint level to show
        const hintLevel = Math.min(this.currentPuzzle.hintCount || 0, 2);
        this.currentPuzzle.hintCount = (this.currentPuzzle.hintCount || 0) + 1;
        
        return hints[hintLevel];
    }
    
    /**
     * Get a descriptive name for a piece
     */
    getPieceName(pieceType) {
        const pieceNames = {
            'p': 'pawn',
            'n': 'knight',
            'b': 'bishop',
            'r': 'rook',
            'q': 'queen',
            'k': 'king'
        };
        
        return pieceNames[pieceType] || 'piece';
    }
    
    /**
     * Get a descriptive name for a square
     */
    getSquareDescription(square) {
        const file = square.charAt(0);
        const rank = square.charAt(1);
        
        let area = '';
        
        // Determine file area
        if (file === 'a' || file === 'b' || file === 'c') {
            area += 'queenside';
        } else if (file === 'f' || file === 'g' || file === 'h') {
            area += 'kingside';
        } else {
            area += 'center';
        }
        
        // Determine rank area
        if (rank === '1' || rank === '2') {
            area += ' back rank';
        } else if (rank === '7' || rank === '8') {
            area += ' front rank';
        } else if (rank === '4' || rank === '5') {
            area += ' middle';
        }
        
        return area;
    }
    
    /**
     * Get puzzle statistics
     */
    getPuzzleStats() {
        const stats = {
            total: this.puzzleHistory.length,
            solved: 0,
            failed: 0,
            abandoned: 0
        };
        
        this.puzzleHistory.forEach(puzzle => {
            if (puzzle.result === 'solved') stats.solved++;
            else if (puzzle.result === 'failed') stats.failed++;
            else if (puzzle.result === 'abandoned') stats.abandoned++;
        });
        
        return stats;
    }
    
    /**
     * Export puzzle history
     */
    exportPuzzleHistory() {
        return JSON.stringify(this.puzzleHistory);
    }
    
    /**
     * Import puzzle history
     */
    importPuzzleHistory(historyJson) {
        try {
            const history = JSON.parse(historyJson);
            if (Array.isArray(history)) {
                this.puzzleHistory = history;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error importing puzzle history:", e);
            return false;
        }
    }
    
    /**
     * Get explanation for the current puzzle
     */
    getPuzzleExplanation() {
        if (!this.currentPuzzle) return null;
        
        return {
            objective: this.currentPuzzle.objective || "Find the best move",
            explanation: this.currentPuzzle.explanation || "No explanation available",
            theme: this.currentPuzzle.theme || "General tactics"
        };
    }
}

// Export the PuzzleCore class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleCore };
}
