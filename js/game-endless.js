// Endless Mode - Game with Hearts System
// Player has 3 hearts, loses 1 heart per wrong answer, game over when hearts = 0

const GameEndless = {
    hearts: 3,
    maxHearts: 3,

    // Initialize endless mode
    init() {
        console.log('Starting Endless Mode...');
        this.hearts = this.maxHearts;
        currentScore = 0;
        
        // Reset all game state
        obstacles = [];
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        hasAnsweredCorrectly = false;
        hasAnsweredWrong = false;
        targetObstacle = null;
        
        // Reset character
        characterConfig.y = config.groundY;
        characterConfig.isJumping = false;
        characterConfig.paused = false;
        characterConfig.currentAnimation = 'run';
        characterConfig.frameIndex = 0;
        
        // Spawn first obstacle
        Game.spawnObstacle();
        lastQuizEnd = Date.now();
        this.setupControls();
        this.loop();
    },

    // Handle wrong answers - lose heart instead of immediate game over
    handleWrongAnswer() {
        this.hearts--;
        console.log(`Wrong answer! Hearts remaining: ${this.hearts}`);
        
        if (this.hearts <= 0) {
            // Game over - no hearts left
            console.log('No hearts left! Game Over.');
            
            // Play fail sound effects
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            if (currentChar) {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.7);
            }
            AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
            
            config.gameState = 'gameOver';
            obstacles = [];
            isQuizActive = false;
            isGamePaused = false;
            slowFactor = 1;
            currentQuestion = null;
            quizInput = '';
            hasAnsweredCorrectly = false;
            hasAnsweredWrong = false;
            targetObstacle = null;
        } else {
            // Still have hearts - continue playing but mark as wrong answer
            hasAnsweredWrong = true;
        }
        
        // Reset quiz
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        lastQuizEnd = Date.now();
    },

    // Draw hearts UI
    drawHeartsUI() {
        if (config.gameState !== 'playing') return;
        
        // Hearts display
        const heartSize = 40;
        const heartSpacing = 50;
        const startX = config.width - (this.maxHearts * heartSpacing) - 20;
        const startY = 80;
        
        for (let i = 0; i < this.maxHearts; i++) {
            const x = startX + i * heartSpacing;
            const heartColor = i < this.hearts ? '#ff4757' : '#666';
            
            // Draw heart background
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            config.ctx.fillRect(x - 5, startY - 5, heartSize + 10, heartSize + 10);
            
            // Draw heart
            config.ctx.fillStyle = heartColor;
            config.ctx.font = `${heartSize}px Arial`;
            config.ctx.textAlign = 'center';
            config.ctx.fillText('❤️', x + heartSize/2, startY + heartSize - 5);
        }
        
        // Hearts label
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '16px Arial';
        config.ctx.textAlign = 'left';
        config.ctx.fillText('Lives:', startX - 50, startY + 20);
    },

    // Setup controls for endless mode
    setupControls() {
        // Click handler for quiz
        config.canvas.addEventListener('click', (e) => {
            if (!isQuizActive) return;
            Quiz.handleClick(e);
        });

        document.addEventListener('keydown', (e) => {
            if (config.gameState !== 'playing') return;

            if (isQuizActive) {
                // Let Quiz module handle all quiz inputs
                Quiz.handleKeyboard(e);
            } else {
                // Game controls
                switch (e.key) {
                    case 'Escape':
                        // Return to menu
                        config.gameState = 'menu';
                        Menu.loop();
                        break;
                }
            }
        });
    },

    // Main game loop for endless mode
    loop(currentTime = 0) {
        // Calculate delta time
        if (lastFrameTime === 0) {
            lastFrameTime = currentTime;
        }
        deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        // FPS counter
        frameCount++;
        if (currentTime - lastFpsUpdate >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsUpdate = currentTime;
        }

        config.ctx.clearRect(0, 0, config.width, config.height);
        
        // Update game logic
        Game.updateObstacles();
        if (!isGamePaused) {
            Game.updateCharacter();
        }
        Game.updateQuiz();

        // Draw everything
        Game.drawBackground();
        Game.drawObstacles();
        Game.drawCharacter();
        Game.drawUI();
        this.drawHeartsUI(); // Draw hearts specific to endless mode
        
        if (isQuizActive) {
            Quiz.draw();
        }

        if (config.gameState === 'gameOver') {
            // Switch to game over screen
            document.addEventListener('keydown', GameOver.handleInput.bind(GameOver));
            config.canvas.addEventListener('click', GameOver.handleClick.bind(GameOver));
            GameOver.loop();
            return;
        }

        requestAnimationFrame(this.loop.bind(this));
    }
};