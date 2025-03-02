/**
 * Enhanced Chess Puzzle Generator
 * 
 * Generates educational chess puzzles with traps and varying difficulty levels
 * to help users improve their chess skills systematically.
 */

class PuzzleGenerator {
    constructor(options = {}) {
        this.options = {
            includeTraps: true,           // Whether to include trap puzzles
            trapFrequency: 0.3,           // How often to include traps (0-1)
            useLichessApi: false,         // Whether to use Lichess API for puzzles
            usePgnDatabase: true,         // Whether to use local PGN database
            lichessApiKey: null,          // Lichess API key (if used)
            ...options
        };
        
        this.traps = new PuzzleTraps(); // Initialize the traps system
        
        // Local puzzle database categorized by themes and difficulty
        this.puzzleDatabase = {
            "pins": {
                "easy": [],
                "medium": [],
                "hard": [],
                "expert": []
            },
            "forks": {
                "easy": [],
                "medium": [],
                "hard": [],
                "expert": []
            },
            // Other tactical themes would be populated here
            // This is just a stub that would be filled with real puzzles
        };
        
        // Initialize the database with some sample puzzles
        this.initializePuzzleDatabase();
    }
    
    /**
     * Initialize the puzzle database with sample puzzles
     */
    initializePuzzleDatabase() {
        // These would typically be loaded from a file or external source
        // This is just for demonstration purposes
        
        // Sample pin puzzles
        this.puzzleDatabase["pins"]["easy"].push({
            id: "pin-easy-1",
            fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
            moves: ["c4f7", "e8f7", "d1f3", "f7e8", "f3f7"],
            theme: "pins",
            category: "tactics",
            difficulty: "easy",
            objective: "Find the pin that leads to material gain",
            explanation: "The bishop pins the f7 pawn to the king, winning material after the queen check.",
            orientation: "white",
            expectedTime: 30 // seconds
        });
        
        // Sample fork puzzles
        this.puzzleDatabase["forks"]["medium"].push({
            id: "fork-medium-1",
            fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
            moves: ["f3e5", "d7d6", "e5c6", "b7c6"],
            theme: "forks",
            category: "tactics",
            difficulty: "medium",
            objective: "Find the knight fork",
            explanation: "The knight on e5 forks the queen and rook, gaining material.",
            orientation: "white",
            expectedTime: 45
        });
        
        // Additional puzzles would be added for each theme and difficulty level
    }
    
    /**
     * Generate a puzzle based on specified criteria
     * @param {string} theme - The tactical theme to focus on
     * @param {string} difficulty - The difficulty level
     * @param {boolean} includeTrap - Whether to include a trap in the puzzle
     * @returns {Object} A puzzle object
     */
    generatePuzzle(theme = null, difficulty = "medium", includeTrap = null) {
        // Default to random theme if none specified
        if (!theme) {
            const themes = Object.keys(this.puzzleDatabase);
            theme = themes[Math.floor(Math.random() * themes.length)];
        }
        
        // Default trap inclusion to the configured frequency
        if (includeTrap === null) {
            includeTrap = this.options.includeTraps && Math.random() < this.options.trapFrequency;
        }
        
        // Get puzzles matching the criteria
        let puzzles = [];
        if (this.puzzleDatabase[theme] && this.puzzleDatabase[theme][difficulty]) {
            puzzles = this.puzzleDatabase[theme][difficulty];
        }
        
        // If no puzzles match, try to find any puzzle of the right difficulty
        if (puzzles.length === 0) {
            for (const t in this.puzzleDatabase) {
                if (this.puzzleDatabase[t][difficulty] && this.puzzleDatabase[t][difficulty].length > 0) {
                    puzzles = this.puzzleDatabase[t][difficulty];
                    break;
                }
            }
        }
        
        // If still no puzzles, generate a random one
        if (puzzles.length === 0) {
            return this.generateRandomPuzzle(theme, difficulty);
        }
        
        // Select a random puzzle from the matching ones
        const puzzleIndex = Math.floor(Math.random() * puzzles.length);
        const puzzle = JSON.parse(JSON.stringify(puzzles[puzzleIndex])); // Clone to avoid modifying original
        
        // Add a trap if requested
        if (includeTrap && this.options.includeTraps) {
            return this.traps.enhancePuzzleWithTraps(puzzle);
        }
        
        return puzzle;
    }
    
    /**
     * Generate puzzles by themes
     * @param {Array} themes - List of themes to include
     * @param {string} difficulty - The difficulty level
     * @param {number} count - How many puzzles to generate
     * @returns {Array} Array of puzzle objects
     */
    generatePuzzlesByThemes(themes, difficulty = "medium", count = 5) {
        const puzzles = [];
        
        // Generate puzzles for each theme
        for (let i = 0; i < count; i++) {
            const theme = themes[i % themes.length]; // Cycle through themes
            const includeTrap = i % 3 === 0; // Include traps in roughly 1/3 of puzzles
            
            puzzles.push(this.generatePuzzle(theme, difficulty, includeTrap));
        }
        
        return puzzles;
    }
    
    /**
     * Generate a completely random puzzle when no matching ones exist
     * This is a fallback method that would ideally use a chess engine
     */
    generateRandomPuzzle(theme = "general", difficulty = "medium") {
        // In a real implementation, this would use a chess engine to analyze positions
        // For this demo, we'll return a simple hardcoded puzzle
        
        const difficultyRating = {
            "easy": 1000,
            "medium": 1500,
            "hard": 2000,
            "expert": 2500
        };
        
        // Simple randomly selected puzzle templates
        const templates = [
            {
                fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
                moves: ["c4f7", "e8f7", "d1f3"],
                orientation: "white",
                objective: "Find the tactical opportunity"
            },
            {
                fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
                moves: ["f3e5", "d7d6", "e5c6"],
                orientation: "white",
                objective: "Find the best tactical move"
            },
            {
                fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq d6 0 5",
                moves: ["e4d5", "c6d4", "f3d4"],
                orientation: "white",
                objective: "Find the best capture"
            }
        ];
        
        // Select a random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Create unique ID for the puzzle
        const puzzleId = `${theme}-${difficulty}-${Date.now().toString(36)}`;
        
        // Generate a new puzzle based on the template
        const puzzle = {
            id: puzzleId,
            fen: template.fen,
            moves: [...template.moves], // Clone to avoid modifying template
            theme: theme,
            category: "tactics",
            difficulty: difficulty,
            rating: difficultyRating[difficulty] || 1500,
            objective: template.objective,
            explanation: `This is a ${theme} puzzle at ${difficulty} level.`,
            orientation: template.orientation,
            expectedTime: difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 90
        };
        
        // Add a trap if appropriate
        if (this.options.includeTraps && Math.random() < this.options.trapFrequency) {
            return this.traps.enhancePuzzleWithTraps(puzzle);
        }
        
        return puzzle;
    }
    
    /**
     * Fetch puzzles from Lichess API if enabled
     * @param {string} theme - The tactical theme
     * @param {string} difficulty - The difficulty level
     * @param {number} count - How many puzzles to fetch
     */
    async fetchPuzzlesFromLichess(theme, difficulty, count = 5) {
        if (!this.options.useLichessApi || !this.options.lichessApiKey) {
            return [];
        }
        
        // Map our difficulty levels to Lichess ratings ranges
        const ratingRanges = {
            "easy": "1000-1400",
            "medium": "1400-1800",
            "hard": "1800-2200",
            "expert": "2200-2600"
        };
        
        const ratingRange = ratingRanges[difficulty] || "1400-1800";
        
        try {
            // This would be a real API call in production
            // For this demo, we'll simulate a response
            console.log(`Simulating Lichess API call for ${theme} puzzles at ${ratingRange} rating`);
            
            // Simulate API response delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Return empty array for now - in a real implementation this would fetch from Lichess
            return [];
        } catch (error) {
            console.error("Error fetching puzzles from Lichess:", error);
            return [];
        }
    }
    
    /**
     * Check if the system generates traps
     * @returns {boolean} Whether trap generation is enabled
     */
    doesSystemGenerateTraps() {
        return this.options.includeTraps;
    }
    
    /**
     * Toggle trap generation
     * @param {boolean} enable - Whether to enable trap generation
     */
    setTrapGeneration(enable) {
        this.options.includeTraps = enable;
        return this.options.includeTraps;
    }
    
    /**
     * Set the frequency of trap puzzles
     * @param {number} frequency - Value between 0 and 1
     */
    setTrapFrequency(frequency) {
        this.options.trapFrequency = Math.min(1, Math.max(0, frequency));
        return this.options.trapFrequency;
    }
}

// Export the PuzzleGenerator class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PuzzleGenerator };
}
