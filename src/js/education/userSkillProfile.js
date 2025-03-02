/**
 * User Skill Profile Class
 * 
 * Tracks a user's chess skills, performance on different puzzle themes,
 * and provides recommendations for improvement.
 */

class UserSkillProfile {
    constructor(userId) {
        this.userId = userId;
        this.ratings = {
            overall: 1200,          // Starting ELO rating
            tactics: 1200,          // Tactical rating
            strategy: 1200,         // Strategic rating
            endgame: 1200,          // Endgame rating
            openings: 1200          // Opening knowledge rating
        };
        
        // Performance on different puzzle themes
        this.themePerformance = {
            // Example format:
            // "pins": { attempts: 10, correct: 7, avgTime: 45, lastAttempt: timestamp }
        };
        
        // List of solved puzzles to avoid repetition
        this.solvedPuzzles = [];
        
        // Identified themes the user struggles with
        this.struggledThemes = [];
        
        // Current focus for improvement
        this.currentFocus = null;
        
        // Current skill level description
        this.currentLevel = "Beginner";
        
        // Last rating change
        this.lastRatingChange = 0;
    }
    
    /**
     * Update profile after completing a puzzle
     * @param {Object} puzzle - The puzzle that was completed
     * @param {boolean} correct - Whether the puzzle was solved correctly
     * @param {number} timeSpent - Time spent on puzzle in seconds
     * @param {number} hintsUsed - Number of hints used
     */
    updateAfterPuzzle(puzzle, correct, timeSpent, hintsUsed) {
        // Record puzzle in solved list
        if (!this.solvedPuzzles.includes(puzzle.id)) {
            this.solvedPuzzles.push(puzzle.id);
        }
        
        // Update theme performance
        const theme = puzzle.theme || 'general';
        if (!this.themePerformance[theme]) {
            this.themePerformance[theme] = { 
                attempts: 0, 
                correct: 0, 
                avgTime: 0,
                lastAttempt: null
            };
        }
        
        const themeStats = this.themePerformance[theme];
        themeStats.attempts += 1;
        if (correct) {
            themeStats.correct += 1;
        }
        
        // Update average time
        themeStats.avgTime = (themeStats.avgTime * (themeStats.attempts - 1) + timeSpent) / themeStats.attempts;
        themeStats.lastAttempt = new Date();
        
        // Calculate rating change
        const baseChange = correct ? 10 : -5;
        
        // Adjust based on puzzle difficulty relative to user rating
        const difficultyDelta = (puzzle.rating || 1500) - this.ratings.overall;
        const difficultyFactor = (1 + difficultyDelta / 400);
        
        // Time factor - reward faster solutions, less penalty for taking time
        const expectedTime = puzzle.expectedTime || 60;
        const timeFactor = correct ? 
            Math.max(0.5, Math.min(1.5, expectedTime / timeSpent)) : 
            1;
            
        // Hints penalty - reduce rating gain if hints were used
        const hintFactor = hintsUsed > 0 ? 
            Math.max(0.2, 1 - (hintsUsed * 0.2)) : 
            1;
        
        // Calculate final rating change
        const ratingChange = Math.round(baseChange * difficultyFactor * timeFactor * hintFactor);
        
        // Update overall rating
        this.lastRatingChange = ratingChange;
        this.ratings.overall += ratingChange;
        
        // Also update specific category ratings
        const category = puzzle.category || 'tactics';
        if (this.ratings[category]) {
            this.ratings[category] += ratingChange;
        }
        
        // Update struggled themes
        this.updateStruggledThemes();
        
        // Update skill level
        this.updateSkillLevel();
        
        // Set focus if needed
        if (!this.currentFocus || Math.random() < 0.2) { // 20% chance to reassess focus
            this.updateFocus();
        }
        
        return this.lastRatingChange;
    }
    
    /**
     * Update the list of themes the user struggles with
     */
    updateStruggledThemes() {
        this.struggledThemes = [];
        
        // Look for themes with at least 3 attempts and less than 50% success rate
        for (const theme in this.themePerformance) {
            const stats = this.themePerformance[theme];
            if (stats.attempts >= 3 && (stats.correct / stats.attempts) < 0.5) {
                this.struggledThemes.push({
                    theme: theme,
                    successRate: stats.correct / stats.attempts,
                    attempts: stats.attempts
                });
            }
        }
        
        // Sort by success rate, lowest first
        this.struggledThemes.sort((a, b) => a.successRate - b.successRate);
    }
    
    /**
     * Update the user's current skill level description
     */
    updateSkillLevel() {
        const rating = this.ratings.overall;
        
        if (rating < 1200) {
            this.currentLevel = "Beginner";
        } else if (rating < 1400) {
            this.currentLevel = "Intermediate";
        } else if (rating < 1600) {
            this.currentLevel = "Advanced";
        } else if (rating < 1800) {
            this.currentLevel = "Expert";
        } else if (rating < 2000) {
            this.currentLevel = "Master";
        } else {
            this.currentLevel = "Grandmaster";
        }
    }
    
    /**
     * Update the focus area for improvement
     */
    updateFocus() {
        if (this.struggledThemes.length > 0) {
            // Focus on the worst-performing theme
            this.currentFocus = this.struggledThemes[0].theme;
        } else {
            // Find least practiced themes
            const themeAttempts = Object.entries(this.themePerformance)
                .map(([theme, stats]) => ({theme, attempts: stats.attempts}))
                .sort((a, b) => a.attempts - b.attempts);
                
            if (themeAttempts.length > 0) {
                this.currentFocus = themeAttempts[0].theme;
            } else {
                // Default focus on general tactical awareness
                this.currentFocus = "tactical patterns";
            }
        }
    }
    
    /**
     * Get recommended themes for practice
     * @param {number} count - Number of themes to recommend
     * @returns {Array} Array of recommended themes
     */
    getRecommendedThemes(count = 3) {
        const recommendations = [];
        
        // First add current focus
        if (this.currentFocus) {
            recommendations.push(this.currentFocus);
        }
        
        // Then add struggled themes
        for (const theme of this.struggledThemes) {
            if (!recommendations.includes(theme.theme)) {
                recommendations.push(theme.theme);
                if (recommendations.length >= count) break;
            }
        }
        
        // If we still need more, add themes with least practice
        if (recommendations.length < count) {
            const themesSortedByAttempts = Object.entries(this.themePerformance)
                .map(([theme, stats]) => ({theme, attempts: stats.attempts}))
                .sort((a, b) => a.attempts - b.attempts);
                
            for (const {theme} of themesSortedByAttempts) {
                if (!recommendations.includes(theme)) {
                    recommendations.push(theme);
                    if (recommendations.length >= count) break;
                }
            }
        }
        
        // Fill remaining slots with general themes
        const generalThemes = ['pins', 'forks', 'discovered attacks', 'removing the defender'];
        let i = 0;
        while (recommendations.length < count && i < generalThemes.length) {
            if (!recommendations.includes(generalThemes[i])) {
                recommendations.push(generalThemes[i]);
            }
            i++;
        }
        
        return recommendations.slice(0, count);
    }
    
    /**
     * Get themes the user is strongest at
     * @param {number} count - Number of themes to return
     * @returns {Array} Array of strength themes
     */
    getStrengthThemes(count = 3) {
        const themesWithSuccess = Object.entries(this.themePerformance)
            .filter(([_, stats]) => stats.attempts >= 3) // Only consider themes with enough attempts
            .map(([theme, stats]) => ({
                theme,
                successRate: stats.correct / stats.attempts
            }))
            .sort((a, b) => b.successRate - a.successRate);
            
        return themesWithSuccess.slice(0, count).map(item => item.theme);
    }
    
    /**
     * Get themes the user is weak at
     * @param {number} count - Number of themes to return
     * @returns {Array} Array of weakness themes
     */
    getWeaknessThemes(count = 3) {
        return this.struggledThemes.slice(0, count).map(item => item.theme);
    }
    
    /**
     * Get a summary of the user's skill profile
     * @returns {Object} Summary data
     */
    getSummary() {
        // Calculate success rate across all themes
        let totalAttempts = 0;
        let totalCorrect = 0;
        
        Object.values(this.themePerformance).forEach(stats => {
            totalAttempts += stats.attempts;
            totalCorrect += stats.correct;
        });
        
        const overallSuccessRate = totalAttempts > 0 ? 
            (totalCorrect / totalAttempts * 100).toFixed(1) + '%' : 
            'No data';
            
        // Calculate next level progress
        const currentRating = this.ratings.overall;
        let nextLevel, nextLevelRating, progress;
        
        if (currentRating < 1200) {
            nextLevel = "Intermediate";
            nextLevelRating = 1200;
        } else if (currentRating < 1400) {
            nextLevel = "Advanced";
            nextLevelRating = 1400;
        } else if (currentRating < 1600) {
            nextLevel = "Expert";
            nextLevelRating = 1600;
        } else if (currentRating < 1800) {
            nextLevel = "Master";
            nextLevelRating = 1800;
        } else if (currentRating < 2000) {
            nextLevel = "Grandmaster";
            nextLevelRating = 2000;
        } else {
            nextLevel = "Elite Grandmaster";
            nextLevelRating = 2200;
        }
        
        const ratingRange = 200; // Each level is typically 200 rating points
        const pointsToNextLevel = nextLevelRating - currentRating;
        const nextLevelProgress = Math.max(0, (1 - pointsToNextLevel / ratingRange) * 100).toFixed(1) + '%';
            
        return {
            userId: this.userId,
            ratings: this.ratings,
            currentLevel: this.currentLevel,
            nextLevel: nextLevel,
            nextLevelProgress: nextLevelProgress,
            puzzlesSolved: this.solvedPuzzles.length,
            successRate: overallSuccessRate,
            strengthThemes: this.getStrengthThemes(),
            weaknessThemes: this.getWeaknessThemes(),
            recommendedFocus: this.currentFocus,
            totalThemesAttempted: Object.keys(this.themePerformance).length
        };
    }
}

// Export the UserSkillProfile class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserSkillProfile };
}
