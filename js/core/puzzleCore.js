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
    getHint() {
        if (!this.currentPuzzle) return null;
        
        // Get the expected move at the current position
        const expectedM
