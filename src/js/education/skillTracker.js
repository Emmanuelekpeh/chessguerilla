/**
 * Chess Skill Tracking System
 * 
 * Tracks user progress, recommends puzzles based on skill level,
 * and provides an educational path for chess improvement
 */

import { UserSkillProfile } from './userSkillProfile';

class SkillTracker {
    constructor(userId) {
        this.userId = userId;
        this.skillProfile = new UserSkillProfile(userId);
        this.learningPath = [];
        this.currentLessonIndex = 0;
        this.completedLessons = [];
        this.milestones = [];
        
        // Initialize the learning path
        this.initializeLearningPath();
    }
    
    /**
     * Initialize the educational learning path
     */
    initializeLearningPath() {
        this.learningPath = [
            // Beginner lessons
            {
                id: "basic-tactics-1",
                title: "Introduction to Basic Tactics",
                themes: ["pins", "forks"],
                difficulty: "easy",
                requiredRating: 0,
                puzzleCount: 5
            },
            {
                id: "opening-principles-1",
                title: "Opening Principles: Control the Center",
                themes: ["center control", "piece development"],
                difficulty: "easy",
                requiredRating: 1000,
                puzzleCount: 5
            },
            {
                id: "basic-tactics-2",
                title: "Discovered Attacks and Skewers",
                themes: ["discovered attacks", "skewers"],
                difficulty: "easy",
                requiredRating: 1050,
                puzzleCount: 5
            },
            
            // Intermediate lessons
            {
                id: "middlegame-1",
                title: "Attacking the King",
                themes: ["attacking the king", "piece coordination"],
                difficulty: "medium",
                requiredRating: 1300,
                puzzleCount: 5
            },
            {
                id: "tactics-intermediate-1",
                title: "Double Attacks and Deflection",
                themes: ["double attacks", "deflection"],
                difficulty: "medium",
                requiredRating: 1350,
                puzzleCount: 5
            },
            {
                id: "endgame-1",
                title: "Basic Endgame Principles",
                themes: ["king and pawn", "rook endgames"],
                difficulty: "medium",
                requiredRating: 1400,
                puzzleCount: 5
            },
            
            // Advanced lessons
            {
                id: "tactics-advanced-1",
                title: "Zwischenzug and Interference",
                themes: ["zwischenzug", "interference"],
                difficulty: "hard",
                requiredRating: 1600,
                puzzleCount: 5
            },
            {
                id: "advanced-endgame-1",
                title: "Complex Endgame Techniques",
                themes: ["fortress positions", "zugzwang positions"],
                difficulty: "hard",
                requiredRating: 1700,
                puzzleCount: 5
            },
            {
                id: "positional-mastery",
                title: "Positional Chess Mastery",
                themes: ["prophylaxis", "piece coordination"],
                difficulty: "expert",
                requiredRating: 1800,
                puzzleCount: 5
            }
        ];
        
        // Set up milestones
        this.milestones = [
            { rating: 1200, title: "Chess Apprentice", description: "You've mastered the basic tactics!" },
            { rating: 1400, title: "Chess Tactician", description: "You're skilled at finding tactical opportunities." },
            { rating: 1600, title: "Chess Strategist", description: "You understand deeper positional concepts." },
            { rating: 1800, title: "Chess Expert", description: "You can handle complex positions with ease." },
            { rating: 2000, title: "Chess Master", description: "Your chess understanding is exceptional!" }
        ];
    }
    
    /**
     * Get the next lesson for the user based on their skill profile
     */
    getNextLesson() {
        // Find first incomplete lesson that the user has the required rating for
        for (let i = 0; i < this.learningPath.length; i++) {
            const lesson = this.learningPath[i];
            if (!this.completedLessons.includes(lesson.id) && 
                this.skillProfile.ratings.overall >= lesson.requiredRating) {
                this.currentLessonIndex = i;
                return lesson;
            }
        }
        
        // If all lessons completed or none available for rating, return highest appropriate lesson
        for (let i = this.learningPath.length - 1; i >= 0; i--) {
            if (this.skillProfile.ratings.overall >= this.learningPath[i].requiredRating) {
                this.currentLessonIndex = i;
                return this.learningPath[i];
            }
        }
        
        // Default to first lesson
        this.currentLessonIndex = 0;
        return this.learningPath[0];
    }
    
    /**
     * Get puzzles for the current lesson
     */
    getCurrentLessonPuzzles(puzzleGenerator) {
        const currentLesson = this.learningPath[this.currentLessonIndex];
        if (!currentLesson) return [];
        
        // Generate puzzles based on lesson themes and difficulty
        return puzzleGenerator.generatePuzzlesByThemes(
            currentLesson.themes,
            currentLesson.difficulty,
            currentLesson.puzzleCount
        );
    }
    
    /**
     * Update skill profile after completing a puzzle
     */
    updateAfterPuzzle(puzzle, correct, timeSpent, hintsUsed) {
        // Update the skill profile
        this.skillProfile.updateAfterPuzzle(puzzle, correct, timeSpent, hintsUsed);
        
        // Check for achieved milestones
        const achievedMilestones = this.checkForNewMilestones();
        
        // Check if lesson completed
        let lessonCompleted = false;
        const currentLesson = this.learningPath[this.currentLessonIndex];
        
        // Mark lesson as completed if all its puzzles are solved
        if (currentLesson && !this.completedLessons.includes(currentLesson.id)) {
            const currentLessonThemes = currentLesson.themes;
            let allThemesSolved = true;
            
            for (const theme of currentLessonThemes) {
                const themePerformance = this.skillProfile.themePerformance[theme];
                if (!themePerformance || themePerformance.attempts < 5 || themePerformance.correct / themePerformance.attempts < 0.6) {
                    allThemesSolved = false;
                    break;
                }
            }
            
            if (allThemesSolved) {
                this.completedLessons.push(currentLesson.id);
                lessonCompleted = true;
            }
        }
        
        return {
            newRating: this.skillProfile.ratings.overall,
            ratingChange: this.skillProfile.lastRatingChange || 0,
            achievedMilestones: achievedMilestones,
            lessonCompleted: lessonCompleted,
            nextLesson: lessonCompleted ? this.getNextLesson() : null,
            recommendedThemes: this.skillProfile.getRecommendedThemes()
        };
    }
    
    /**
     * Check for newly achieved milestones
     */
    checkForNewMilestones() {
        const achievedMilestones = [];
        const currentRating = this.skillProfile.ratings.overall;
        
        for (const milestone of this.milestones) {
            if (currentRating >= milestone.rating && 
                !milestone.achieved) {
                
                milestone.achieved = true;
                milestone.dateAchieved = new Date();
                achievedMilestones.push(milestone);
            }
        }
        
        return achievedMilestones;
    }
    
    /**
     * Get a performance summary
     */
    getPerformanceSummary() {
        const summary = this.skillProfile.getSummary();
        
        // Add learning progress
        summary.completedLessons = this.completedLessons.length;
        summary.totalLessons = this.learningPath.length;
        summary.lessonProgress = (this.completedLessons.length / this.learningPath.length * 100).toFixed(1) + '%';
        
        // Add milestones info
        summary.achievedMilestones = this.milestones.filter(m => m.achieved);
        summary.nextMilestone = this.milestones.find(m => !m.achieved);
        
        if (summary.nextMilestone) {
            const pointsNeeded = summary.nextMilestone.rating - summary.ratings.overall;
            summary.nextMilestoneProgress = Math.max(0, 100 - (pointsNeeded / 2)).toFixed(1) + '%';
        }
        
        return summary;
    }
    
    /**
     * Export user progress data
     */
    exportUserProgress() {
        return JSON.stringify({
            userId: this.userId,
            skillProfile: {
                ratings: this.skillProfile.ratings,
                themePerformance: this.skillProfile.themePerformance,
                solvedPuzzles: this.skillProfile.solvedPuzzles,
                struggledThemes: this.skillProfile.struggledThemes,
                currentFocus: this.skillProfile.currentFocus,
                currentLevel: this.skillProfile.currentLevel
            },
            completedLessons: this.completedLessons,
            currentLessonIndex: this.currentLessonIndex,
            milestones: this.milestones.filter(m => m.achieved)
        });
    }
    
    /**
     * Import user progress data
     */
    importUserProgress(progressJson) {
        try {
            const progress = JSON.parse(progressJson);
            
            if (progress.userId === this.userId) {
                // Import skill profile data
                this.skillProfile.ratings = progress.skillProfile.ratings || this.skillProfile.ratings;
                this.skillProfile.themePerformance = progress.skillProfile.themePerformance || this.skillProfile.themePerformance;
                this.skillProfile.solvedPuzzles = progress.skillProfile.solvedPuzzles || this.skillProfile.solvedPuzzles;
                this.skillProfile.struggledThemes = progress.skillProfile.struggledThemes || this.skillProfile.struggledThemes;
                this.skillProfile.currentFocus = progress.skillProfile.currentFocus || this.skillProfile.currentFocus;
                this.skillProfile.currentLevel = progress.skillProfile.currentLevel || this.skillProfile.currentLevel;
                
                // Import lesson progress
                this.completedLessons = progress.completedLessons || this.completedLessons;
                this.currentLessonIndex = progress.currentLessonIndex || this.currentLessonIndex;
                
                // Import achieved milestones
                if (progress.milestones && Array.isArray(progress.milestones)) {
                    for (const achievedMilestone of progress.milestones) {
                        const milestone = this.milestones.find(m => m.rating === achievedMilestone.rating);
                        if (milestone) {
                            milestone.achieved = true;
                            milestone.dateAchieved = new Date(achievedMilestone.dateAchieved);
                        }
                    }
                }
                
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error importing user progress:", e);
            return false;
        }
    }
}

export { SkillTracker };

// For backwards compatibility with CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkillTracker };
}
