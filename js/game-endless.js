// Endless Mode - Game with Hearts System
// Player has 3 hearts, loses 1 heart per wrong answer, game over when hearts = 0

const GameEndless = {
    hearts: 3,
    maxHearts: 3,

    // Initialize endless mode - called by game-core.js
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
        if (!isQuizActive && currentTime - lastQuizEnd > OBSTACLE_SPAWN_INTERVAL) {
            Game.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        // Move obstacles
        obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);

            // Trigger quiz if obstacle is near character and not already jumping or quiz active
            if (obstacle.x < characterConfig.x + QUIZ_TRIGGER_DISTANCE && obstacle.x > characterConfig.x + QUIZ_TRIGGER_DISTANCE - 100 && !characterConfig.isJumping && !isQuizActive && !obstacle.hasTriggeredQuiz) {
                // Start quiz
                currentQuestion = quizData[Math.floor(Math.random() * quizData.length)];
                isQuizActive = true;
                isGamePaused = true;
                slowFactor = 0.2;
                quizStartTime = currentTime;
                quizTimer = QUIZ_TIME_LIMIT;
                targetObstacle = obstacle; // Mark this as the target to jump
                obstacle.hasTriggeredQuiz = true; // Mark as triggered to prevent re-triggering
            }

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
            if (obstacle.x <= characterConfig.x + 50 && obstacle.x >= characterConfig.x - 50 && !characterConfig.isJumping && !obstacle.hasBeenProcessed) {
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
        obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
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
        }
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

            // Draw heart background
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            config.ctx.fillRect(x - 5, startY - 5, heartSize + 10, heartSize + 10);

            // Draw heart - use different symbols for filled vs empty
            config.ctx.font = `${heartSize}px Arial`;
            config.ctx.textAlign = 'center';
            if (i < this.hearts) {
                // Filled heart - red
                config.ctx.fillStyle = '#ff4757';
                config.ctx.fillText('❤️', x + heartSize / 2, startY + heartSize - 5);
            } else {
                // Empty heart - gray outline
                config.ctx.fillStyle = '#666';
                config.ctx.fillText('🤍', x + heartSize / 2, startY + heartSize - 5);
            }
        }

        // Hearts label with current count
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '16px Arial';
        config.ctx.textAlign = 'left';
        config.ctx.fillText(`Lives: ${this.hearts}/${this.maxHearts}`, startX - 80, startY + 20);
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

    // Update quiz timer for endless mode
    updateQuizEndless() {
        if (isQuizActive) {
            const currentTime = Date.now();
            quizTimer = QUIZ_TIME_LIMIT - (currentTime - quizStartTime);
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

        // Draw everything with endless mode background
        this.drawBackgroundEndless(); // Use endless specific background
        Game.drawObstacles();
        Game.drawCharacter(); // This handles character animation
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