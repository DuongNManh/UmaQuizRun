// Endless Mode - Game with Hearts System
// Player has 3 hearts, loses 1 heart per wrong answer, game over when hearts = 0

// Reuse shared result screen from game-core.js
// GameEndlessResult is created there by ResultScreenFactory



const GameEndless = {
    hearts: 3,
    maxHearts: 3,
    endGameTime: null,
    isEndingGame: false,

    // Initialize endless mode - called by game-core.js
    init() {
        console.log('Starting Endless Mode...');
        this.hearts = this.maxHearts;
        this.endGameTime = null;
        this.isEndingGame = false;

        // Reset character
        characterConfig.y = config.groundY;
        characterConfig.isJumping = false;
        characterConfig.paused = false;
        characterConfig.currentAnimation = 'run';
        characterConfig.frameIndex = 0;
        characterConfig.lastRunningSfxTime = Date.now();

        // Spawn first obstacle
        Game.spawnObstacle();
        lastQuizEnd = Date.now();
        this.setupControls();
        AudioManager.playBackgroundMusic('sounds/bg-endless.ogg', 0.5);
        this.loop();
    },

    // Draw endless mode background with bg2
    drawBackgroundEndless() {
        if (assets.backgrounds.bg2) {
            // Draw first background (normal)
            config.ctx.drawImage(assets.backgrounds.bg2, background.x1, 0, config.width, config.height);

            // Draw second background (flipped for seamless effect)
            config.ctx.save();
            config.ctx.translate(background.x2, 0);
            config.ctx.scale(-1, 1);
            config.ctx.drawImage(assets.backgrounds.bg2, -config.width, 0, config.width, config.height);
            config.ctx.restore();

            // Update positions with slow factor and delta time
            const effectiveSpeed = background.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);
            background.x1 -= effectiveSpeed;
            background.x2 -= effectiveSpeed;

            // Reset positions for infinite scroll
            if (background.x1 <= -config.width) {
                background.x1 = background.x2 + config.width;
            }
            if (background.x2 <= -config.width) {
                background.x2 = background.x1 + config.width;
            }
        }
    },

    // Update obstacles for endless mode with heart system
    updateObstaclesEndless() {

        const currentTime = Date.now();
        if (!isQuizActive && currentTime - lastQuizEnd > (window.nextObstacleSpawnInterval || OBSTACLE_SPAWN_INTERVAL) && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < config.width - 500)) {
            Game.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        // Move obstacles
        obstacles.forEach(obstacle => {
            // Maintain sync between quiz timer and target obstacle impact
            if (isQuizActive && targetObstacle === obstacle) {
                const elapsed = Date.now() - quizStartTime;
                const remainingMs = Math.max(1, quizTimeLimitMs - elapsed);
                const targetX = characterConfig.x + 50; // just in front of character
                const distance = Math.max(0, obstacle.x - targetX);
                if (distance > 0) {
                    const requiredSpeedPerSecond = distance / (remainingMs / 1000);
                    const speedAdjust = requiredSpeedPerSecond * (deltaTime / 1000);
                    obstacle.x -= speedAdjust;
                }
            } else {
                obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);
            }

            QuizManager.triggerIfNeeded(obstacle, () => true);

            // Jump logic - similar to game-10questions
            if ((hasAnsweredCorrectly || hasAnsweredWrong) && targetObstacle === obstacle && !characterConfig.isJumping) {
                const jumpDistance = 250;
                if (obstacle.x < characterConfig.x + jumpDistance && obstacle.x > characterConfig.x - 50) {
                    if (hasAnsweredCorrectly) {
                        // Correct answer - jump over fence
                        characterConfig.isJumping = true;
                        characterConfig.jumpVelocity = characterConfig.jumpPower;
                        characterConfig.paused = true;
                        characterConfig.currentAnimation = 'run';
                        characterConfig.frameIndex = 3;

                        // Reset running SFX timing when jumping
                        characterConfig.lastRunningSfxTime = Date.now();

                        // Play jump and success sound effects
                        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                        if (currentChar) {
                            const jumpSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-jump.ogg`;
                            AudioManager.playSoundEffect(jumpSoundPath, 0.7);
                        }
                        AudioManager.playSoundEffect('sounds/success.ogg', 0.7);
                    } else {
                        // Wrong answer - character runs through fence without jumping
                        console.log('Wrong answer - character runs through the obstacle.');

                        // Play fail sound effect
                        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                        if (currentChar) {
                            const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                            AudioManager.playSoundEffect(failSoundPath, 0.7);
                        }
                        AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
                    }

                    // Reset flags after processing answer
                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // Collision detection - check if character collides with obstacle
            if (!isQuizActive && obstacle.x <= characterConfig.x + 50 && obstacle.x >= characterConfig.x - 50 && !characterConfig.isJumping && !obstacle.hasBeenProcessed) {
                console.log('Collision detected! Character did not jump over obstacle.');
                obstacle.hasBeenProcessed = true; // Mark to prevent multiple processing

                // Only lose heart if this was a wrong answer scenario
                if (hasAnsweredWrong && targetObstacle === obstacle) {
                    console.log('Losing heart due to collision after wrong answer.');
                    this.loseHeart();
                } else if (!hasAnsweredCorrectly && !hasAnsweredWrong) {
                    // No quiz was answered for this obstacle - also lose heart
                    console.log('Losing heart due to collision without answering quiz.');
                    this.loseHeart();
                }
            }

            // Clear obstacle if character successfully jumped over it
            if (obstacle.x < characterConfig.x - 100 && !obstacle.hasBeenProcessed) {
                obstacle.hasBeenProcessed = true;
                // Reset quiz-related flags if this was the target obstacle
                if (targetObstacle === obstacle) {
                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }
        });

        // Remove off-screen obstacles
        ObstacleManager.cleanup();
    },

    // Start endless game mode (legacy method - calls init)
    start() {
        this.init();
    },

    // Handle correct answer - just set flag, don't do anything else yet
    handleCorrectAnswer() {
        hasAnsweredCorrectly = true;
        currentScore++; // Increase score for correct answer

        // Update high score
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('hcmRunnerHighScore', highScore);
        }

        console.log(`Correct! Score: ${currentScore}`);
        this.resetQuizState();
    },

    // Handle wrong answer - just set flag, don't lose heart yet
    handleWrongAnswer() {
        hasAnsweredWrong = true;
        console.log('Wrong answer! Will check collision to determine heart loss.');
        this.resetQuizState();
    },

    // Reset quiz state (close popup)
    resetQuizState() {
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        lastQuizEnd = Date.now();
    },

    // Lose heart (called only when collision occurs)
    loseHeart() {
        this.hearts--;
        console.log(`Lost a heart! Hearts remaining: ${this.hearts}`);

        if (this.hearts <= 0) {
            // Game over - no hearts left
            console.log('No hearts left! Game Over.');

            // Update high score if needed
            if (currentScore > highScore) {
                highScore = currentScore;
                localStorage.setItem('hcmRunnerHighScore', highScore);
            }

            // Start ending game sequence with 3 second delay
            this.isEndingGame = true;
            this.endGameTime = Date.now();

            // Clean up quiz state immediately
            obstacles = [];
            isQuizActive = false;
            isGamePaused = false;
            slowFactor = 1;
            currentQuestion = null;
            quizInput = '';
            hasAnsweredCorrectly = false;
            hasAnsweredWrong = false;
            targetObstacle = null;
        }
    },

    // Show final game over screen after delay
    showGameOverScreen() {
        config.gameState = 'endlessGameOver';
        obstacles = [];
        AudioManager.stopBackgroundMusic();

        // Initialize result screen
        GameEndlessResult.init();
        GameEndlessResult.loop();
    },

    // Draw countdown overlay when ending game
    drawEndingGameUI() {
        if (!this.isEndingGame) return;

        const timeElapsed = Date.now() - this.endGameTime;
        const timeLeft = Math.ceil((3000 - timeElapsed) / 1000);

        if (timeLeft > 0) {
            // Semi-transparent overlay
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            config.ctx.fillRect(0, 0, config.width, config.height);

            // Game Over message
            config.ctx.fillStyle = '#fff';
            config.ctx.font = 'bold 48px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText('Bạn thua rồi!', config.width / 2, config.height / 2 - 50);

            // Score preview
            config.ctx.fillStyle = '#ff9600';
            config.ctx.font = 'bold 32px Arial';
            config.ctx.fillText(`Điểm: ${currentScore}`, config.width / 2, config.height / 2 + 80);
        }
    },
    drawHeartsUI() {
        if (config.gameState !== 'playing') return;
        UI.drawHearts(this.hearts, this.maxHearts);
    },

    // Setup controls for endless mode
    setupControls() {
        // Click handler for quiz
        config.canvas.addEventListener('click', (e) => {
            if (!isQuizActive) return;
            Quiz.handleClick(e);
        });

        // Hover cursor for quiz answers/input
        config.canvas.addEventListener('mousemove', (e) => {
            if (!isQuizActive || !currentQuestion) {
                config.canvas.style.cursor = 'default';
                return;
            }
            Quiz.handleMouseMove(e);
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

    // Update quiz timer for endless mode
    updateQuizEndless() {
        if (isQuizActive) {
            const currentTime = Date.now();
            quizTimer = quizTimeLimitMs - (currentTime - quizStartTime);
            if (quizTimer <= 0) {
                // Time out - call handleWrongAnswer (will be processed as wrong answer)
                console.log('Quiz timeout! Counting as wrong answer.');
                this.handleWrongAnswer();
            }
        }
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

        // Update game logic with endless mode specific functions
        this.updateObstaclesEndless(); // Use endless specific obstacle logic
        if (!isGamePaused) {
            Game.updateCharacter();
        }
        this.updateQuizEndless(); // Use endless specific quiz logic

        // Check if we should show game over screen after delay
        if (this.isEndingGame && Date.now() - this.endGameTime >= 3000) {
            this.showGameOverScreen();
            return;
        }

        if (config.gameState === 'endlessGameOver') {
            // Game over result screen is handled by its own module
            return;
        }

        // Draw everything with endless mode background
        this.drawBackgroundEndless(); // Use endless specific background
        Game.drawObstacles();
        Game.drawCharacter(); // This handles character animation
        Game.drawUI();
        this.drawHeartsUI(); // Draw hearts specific to endless mode
        this.drawEndingGameUI(); // Draw countdown overlay if ending

        if (isQuizActive) {
            Quiz.draw();
        }

        requestAnimationFrame(this.loop.bind(this));
    }
};