// Endless Mode - Game with Hearts System
// Player has 3 hearts, loses 1 heart per wrong answer, game over when hearts = 0

// Game Over screen module for Endless mode
const GameEndlessResult = {
    // Animation configuration
    animation: {
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: 20, // Slow animation
        lastFrameTime: 0,
        isComplete: false,
        hasPlayedOnce: false,
        hasPlayedSound: false
    },

    // Initialize result screen
    init() {
        // Reset animation
        this.animation.frameIndex = 0;
        this.animation.frameCounter = 0;
        this.animation.lastFrameTime = Date.now();
        this.animation.isComplete = false;
        this.animation.hasPlayedOnce = false;
        this.animation.hasPlayedSound = false;
    },

    // Update character animation
    updateAnimation() {
        if (this.animation.isComplete) return;

        const currentTime = Date.now();
        if (currentTime - this.animation.lastFrameTime > this.animation.frameDelay * 16) {
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            const sprite = assets.characters[currentChar.id].idle; // Use idle animation for game over

            // Play sound effect only once when animation starts (popup shows)
            if (this.animation.frameIndex === 0 && !this.animation.hasPlayedSound) {
                if (currentScore >= 10) {
                    // Excellent performance - play win sound
                    if (currentChar) {
                        const winSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-win.ogg`;
                        AudioManager.playSoundEffect(winSoundPath, 0.5);
                    }
                } else {
                    // Normal game over - play fail sound
                    if (currentChar) {
                        const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                        AudioManager.playSoundEffect(failSoundPath, 0.5);
                    }
                    AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
                }
                this.animation.hasPlayedSound = true;
            }

            if (sprite && sprite.complete) {
                const spriteHeight = sprite.height;
                const frameWidth = spriteHeight;
                const frameCount = Math.floor(sprite.width / frameWidth);

                if (frameCount > 1) {
                    this.animation.frameIndex++;
                    if (this.animation.frameIndex >= frameCount) {
                        this.animation.frameIndex = frameCount - 1; // Stay on last frame
                        this.animation.isComplete = true;
                        this.animation.hasPlayedOnce = true;
                    }
                } else {
                    this.animation.isComplete = true;
                    this.animation.hasPlayedOnce = true;
                }

                this.animation.lastFrameTime = currentTime;
            }
        }
    },

    // Draw character animation
    drawCharacter() {
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        const sprite = assets.characters[currentChar.id].win;

        if (sprite && sprite.complete) {
            const spriteHeight = sprite.height;
            const frameWidth = spriteHeight;
            const frameCount = Math.floor(sprite.width / frameWidth);

            // Character display position (left side of the result box)
            const charSize = 180;
            const boxWidth = 700;
            const boxX = (config.width - boxWidth) / 2;
            const charX = boxX + 50;
            const charY = (config.height / 2) - charSize / 2;

            // Draw current frame
            if (frameCount > 1) {
                config.ctx.drawImage(
                    sprite,
                    this.animation.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    charX, charY, charSize, charSize
                );
            } else {
                config.ctx.drawImage(sprite, charX, charY, charSize, charSize);
            }
        }
    },

    // Draw result screen
    draw() {
        // Update animation
        this.updateAnimation();

        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        config.ctx.fillRect(0, 0, config.width, config.height);

        // Result popup box
        const boxWidth = 700;
        const boxHeight = 550;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        // Box background
        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        config.ctx.fill();

        // Box border - red for game over
        const borderColor = '#ff4b4b';
        config.ctx.strokeStyle = borderColor;
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        // Draw character animation on the left
        this.drawCharacter();

        // Adjust text positions to account for character on left
        const textAreaX = boxX + 250;
        const textCenterX = textAreaX + (boxWidth - 250) / 2;

        // Game Over title
        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('GAME OVER!', textCenterX, boxY + 80);

        // Failure message
        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 20px Arial';
        config.ctx.fillText('💔 OUT OF LIVES! 💔', textCenterX, boxY + 120);

        // Score section
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('Final Score', textCenterX, boxY + 180);

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 42px Arial';
        config.ctx.fillText(`${currentScore}`, textCenterX, boxY + 230);

        // High score comparison
        if (currentScore === highScore) {
            config.ctx.fillStyle = '#4CAF50';
            config.ctx.font = 'bold 18px Arial';
            config.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', textCenterX, boxY + 270);
        } else {
            config.ctx.fillStyle = '#4a5568';
            config.ctx.font = 'bold 18px Arial';
            config.ctx.fillText(`High Score: ${highScore}`, textCenterX, boxY + 270);
        }

        // Character name
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        config.ctx.fillStyle = '#666';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText(currentChar ? currentChar.name : 'Unknown', textCenterX, boxY + 300);

        // Single Menu button (like 10 questions mode)
        const buttonWidth = 150;
        const buttonHeight = 60;
        const menuButtonX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 120;

        // Back to Menu button
        config.ctx.fillStyle = '#4a5568';
        config.ctx.beginPath();
        config.ctx.roundRect(menuButtonX, buttonY, buttonWidth, buttonHeight, 15);
        config.ctx.fill();
        config.ctx.strokeStyle = '#fff';
        config.ctx.lineWidth = 2;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText('MENU', menuButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    },

    // Handle input
    handleInput(e) {
        if (config.gameState !== 'endlessGameOver') return;

        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            window.location.reload();
        }
    },

    // Handle clicks
    handleClick(e) {
        if (config.gameState !== 'endlessGameOver') return;

        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX / config.scale;
        const y = (e.clientY - rect.top) * scaleY / config.scale;

        // Adjust for translate
        const offsetX = (config.canvas.width / config.scale - config.width) / 2;
        const offsetY = (config.canvas.height / config.scale - config.height) / 2;
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        const boxWidth = 700;
        const boxHeight = 550;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        const buttonWidth = 150;
        const buttonHeight = 60;
        const menuButtonX = boxX + (boxWidth - buttonWidth) / 2; // Center the button
        const buttonY = boxY + boxHeight - 120;

        // Menu button click detection
        if (adjustedX >= menuButtonX && adjustedX <= menuButtonX + buttonWidth &&
            adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
            window.location.reload(); // Reload the game to reset state
        }
    },

    // Result loop
    loop() {
        if (config.gameState === 'endlessGameOver') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        }
    }
};

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

                // Per-question time limit: use duration_in_seconds if provided, else default
                const durationSeconds = currentQuestion.duration_in_seconds || (QUIZ_TIME_LIMIT / 1000);
                quizTimeLimitMs = durationSeconds * 1000;
                quizTimer = quizTimeLimitMs;
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

        // Initialize result screen
        GameEndlessResult.init();

        // Setup result screen controls
        document.addEventListener('keydown', GameEndlessResult.handleInput.bind(GameEndlessResult));
        config.canvas.addEventListener('click', GameEndlessResult.handleClick.bind(GameEndlessResult));
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
            config.ctx.fillText('Game Over!', config.width / 2, config.height / 2 - 50);

            // Countdown
            config.ctx.fillStyle = '#ff4757';
            config.ctx.font = 'bold 36px Arial';
            config.ctx.fillText(`Showing results in ${timeLeft}...`, config.width / 2, config.height / 2 + 20);

            // Score preview
            config.ctx.fillStyle = '#ff9600';
            config.ctx.font = 'bold 32px Arial';
            config.ctx.fillText(`Final Score: ${currentScore}`, config.width / 2, config.height / 2 + 80);
        }
    },
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