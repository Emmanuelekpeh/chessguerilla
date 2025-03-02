/**
 * Chess Puzzle Trap System
 * 
 * Enhances puzzles with common chess traps that teach players to avoid pitfalls
 * and recognize tactical opportunities.
 */

class PuzzleTraps {
    constructor() {
        // Collection of common chess traps categorized by opening/middlegame/endgame
        this.trapDatabase = {
            openingTraps: [
                {
                    name: "Scholar's Mate",
                    fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
                    trapMove: "f3f7", // Queen takes f7
                    correctDefense: "e8f7", // King takes queen
                    followUp: "c4f7", // Bishop takes f7
                    explanation: "Scholar's Mate trap. The queen capture on f7 looks threatening but loses the queen after Kxf7."
                },
                {
                    name: "Légal Trap",
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
                    trapMove: "f3e5", // Knight takes e5
                    correctDefense: "c6e5", // Knight takes e5
                    followUp: "d1f3", // Queen to f3, threatening mate
                    explanation: "Légal's trap. Black's knight capture appears to win material but allows a devastating queen move."
                },
                {
                    name: "Blackburne Shilling Trap",
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4",
                    trapMove: "f3e5", // Knight takes e5
                    correctDefense: "d8e7", // Queen protects knight
                    followUp: "e5c6", // Knight takes c6
                    explanation: "Blackburne Shilling Trap. Taking the e5 pawn exposes the knight to capture."
                }
            ],
            middlegameTraps: [
                {
                    name: "Greek Gift Sacrifice",
                    fen: "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6",
                    trapMove: "c1h6", // Bishop to h6
                    correctDefense: "g7h6", // Pawn takes bishop
                    followUp: "d1b3", // Queen to b3 threatening checkmate
                    explanation: "The Greek Gift sacrifice. Black should decline by playing Kf8 rather than taking the bishop."
                },
                {
                    name: "Double Bishop Sacrifice",
                    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
                    trapMove: "c4f7", // Bishop takes f7
                    correctDefense: "e8f7", // King takes bishop
                    followUp: "f3e5", // Knight to e5+ forking king and queen
                    explanation: "Double bishop sacrifice trap. After Kxf7, White plays Ne5+ forking the king and queen."
                }
            ],
            endgameTraps: [
                {
                    name: "Back Rank Mate Trap",
                    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
                    trapMove: "a1a8", // Rook to a8 checkmate
                    correctDefense: "f7f6", // Creating luft for the king
                    followUp: "",
                    explanation: "Back rank mate trap. Black must create an escape square for the king with f6 or h6."
                },
                {
                    name: "Queen vs Rook Endgame Trap",
                    fen: "8/8/8/4k3/8/5R2/7K/3q4 b - - 0 1",
                    trapMove: "d1f3", // Queen takes rook
                    correctDefense: "h2g2", // King approaches
                    followUp: "f3f2", // Queen checks king
                    explanation: "Queen vs Rook endgame trap. Taking the rook leads to a stalemate position."
                }
            ]
        };
        
        // Trap detection settings
        this.trapDetectionThreshold = 0.8; // How likely a user is to fall for a trap based on history
    }
    
    /**
     * Adds trap possibilities to a puzzle
     * @param {Object} puzzle - The base puzzle to enhance
     * @param {Object} userProfile - User skill profile to tailor traps
     * @returns {Object} Enhanced puzzle with trap information
     */
    enhancePuzzleWithTraps(puzzle, userProfile = null) {
        // Clone the puzzle to avoid modifying the original
        const enhancedPuzzle = JSON.parse(JSON.stringify(puzzle));
        
        // Select appropriate trap category based on puzzle phase
        let trapCategory = 'openingTraps';
        
        // Determine game phase from FEN
        const piecesCount = this.countPiecesFromFen(puzzle.fen);
        if (piecesCount <= 10) {
            trapCategory = 'endgameTraps';
        } else if (piecesCount <= 20) {
            trapCategory = 'middlegameTraps';
        }
        
        // Select a random trap from the appropriate category
        const traps = this.trapDatabase[trapCategory];
        let selectedTrap = traps[Math.floor(Math.random() * traps.length)];
        
        // If user profile exists, try to select a trap based on user's weakness
        if (userProfile) {
            selectedTrap = this.selectTrapBasedOnUserProfile(userProfile, trapCategory) || selectedTrap;
        }
        
        // Add trap information to the puzzle
        enhancedPuzzle.hasTrap = true;
        enhancedPuzzle.trapInfo = {
            name: selectedTrap.name,
            trapMove: selectedTrap.trapMove,
            correctDefense: selectedTrap.correctDefense,
            followUp: selectedTrap.followUp,
            explanation: selectedTrap.explanation
        };
        
        // Add trap move as an alternative path
        enhancedPuzzle.alternativePaths = enhancedPuzzle.alternativePaths || [];
        enhancedPuzzle.alternativePaths.push({
            move: selectedTrap.trapMove,
            response: selectedTrap.correctDefense,
            evaluation: "mistake",
            explanation: selectedTrap.explanation
        });
        
        return enhancedPuzzle;
    }
    
    /**
     * Select a trap based on user's weaknesses
     */
    selectTrapBasedOnUserProfile(userProfile, trapCategory) {
        if (!userProfile || !userProfile.themePerformance) return null;
        
        // Find user's weakest themes (where they make mistakes)
        const weakThemes = userProfile.getWeaknessThemes(3);
        if (weakThemes.length === 0) return null;
        
        // Select traps that target these weaknesses
        const relevantTraps = this.trapDatabase[trapCategory].filter(trap => {
            // This is a simplified approach - in a real implementation, 
            // we would have more metadata about each trap
            return weakThemes.some(theme => 
                trap.explanation.toLowerCase().includes(theme.toLowerCase())
            );
        });
        
        if (relevantTraps.length === 0) return null;
        
        // Return a random trap from the relevant ones
        return relevantTraps[Math.floor(Math.random() * relevantTraps.length)];
    }
    
    /**
     * Count pieces in a position from FEN string to determine game phase
     */
    countPiecesFromFen(fen) {
        // Extract the piece placement part of the FEN
        const piecePlacement = fen.split(' ')[0];
        
        // Count all pieces (uppercase and lowercase letters represent pieces)
        let pieceCount = 0;
        for (const char of piecePlacement) {
            if (/[a-zA-Z]/.test(char)) {
                pieceCount++;
            }
        }
        
        return pieceCount;
    }
    
    /**
     * Determine if a move is the trap move in a puzzle
     */
    isTrapMove(puzzle, move) {
        return puzzle.hasTrap && puzzle.trapInfo && puzzle.trapInfo.trapMove === move;
    }
    
    /**
     * Provide feedback when user falls for a trap
     */
    getTrapFeedback(puzzle, move) {
        if (!this.isTrapMove(puzzle, move)) return null;
        
        return {
            title: `You fell for the ${puzzle.trapInfo.name} trap!`,
            explanation: puzzle.trapInfo.explanation,
            correctMove: puzzle.moves[0],
            improvement: "Look for forced moves and checks before capturing pieces."
        };
    }
}

// Export the PuzzleTraps class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleTraps };
}
