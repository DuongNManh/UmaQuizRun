// API utility for tracking game play with backend
const API_BASE_URL = 'http://localhost:8080/api'; // Update this to match your backend URL

const GameAPI = {
    /**
     * Track game play with score and duration
     * @param {number} gameId - The game ID from URL parameter
     * @param {string} userId - The user ID (username) from URL parameter
     * @param {number} score - The final score achieved
     * @param {number} duration - The time played in seconds
     */
    async trackPlay(gameId, userId, score, duration) {
        if (!gameId || !userId) {
            console.warn('Cannot track play: missing gameId or userId');
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/games/${gameId}/play?userId=${encodeURIComponent(userId)}&score=${score}&duration=${duration}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.ok) {
                console.log(`Play tracked successfully: gameId=${gameId}, userId=${userId}, score=${score}, duration=${duration}s`);
            } else {
                console.error('Failed to track play:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error tracking play:', error);
        }
    }
};
