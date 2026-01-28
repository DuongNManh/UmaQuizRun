// 10 Questions Mode - Fixed 10 questions, score based on correct answers
// Wrong answers don't cause game over, just continue to next question

// Result screen module for 10 Questions mode
const Game10QuestionsResult = {
    // Win animation configuration
    winAnimation: {
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: 20, // Slow animation (20 frames per sprite change)
        lastFrameTime: 0,
        isComplete: false,
        hasPlayedOnce: false,
        hasPlayedWinSound: false
    },

    // Initialize result screen
    init() {
        // Reset win animation
        this.winAnimation.frameIndex = 0;
        this.winAnimation.frameCounter = 0;
        this.winAnimation.lastFrameTime = Date.now();
        this.winAnimation.isComplete = false;
        this.winAnimation.hasPlayedOnce = false;
        this.winAnimation.hasPlayedWinSound = false;
    },

    // Update win animation
    updateWinAnimation() {
        if (this.winAnimation.isComplete) return;

        const currentTime = Date.now();
        if (currentTime - this.winAnimation.lastFrameTime > this.winAnimation.frameDelay * 16) { // Convert to milliseconds (assuming 60fps base)
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            const winSprite = assets.characters[currentChar.id].win;

            // Play win sound effect only once when animation starts
            if (this.winAnimation.frameIndex === 0 && !this.winAnimation.hasPlayedWinSound) {
                if (currentChar) {
                    const winSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-win.ogg`;
                    AudioManager.playSoundEffect(winSoundPath, 0.5);
                    this.winAnimation.hasPlayedWinSound = true;
                }
            }

            if (winSprite && winSprite.complete) {
                const spriteHeight = winSprite.height;
                const frameWidth = spriteHeight; // Assuming square frames
                const frameCount = Math.floor(winSprite.width / frameWidth);

                if (frameCount > 1) {
                    this.winAnimation.frameIndex++;

                    // Check if animation completed one full cycle
                    if (this.winAnimation.frameIndex >= frameCount) {
                        this.winAnimation.frameIndex = frameCount - 1; // Stay on last frame
                        this.winAnimation.isComplete = true;
                        this.winAnimation.hasPlayedOnce = true;
                    }
                } else {
                    // Single frame sprite
                    this.winAnimation.isComplete = true;
                    this.winAnimation.hasPlayedOnce = true;
                }

                this.winAnimation.lastFrameTime = currentTime;
            }
        }
    },

    // Draw character win animation
    drawWinCharacter() {
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        const winSprite = assets.characters[currentChar.id].win;

        if (winSprite && winSprite.complete) {
            const spriteHeight = winSprite.height;
            const frameWidth = spriteHeight; // Assuming square frames
            const frameCount = Math.floor(winSprite.width / frameWidth);

            // Character display position (left side of the result box)
            const charSize = 180;
            const boxWidth = 700;
            const boxX = (config.width - boxWidth) / 2;
            const charX = boxX + 50; // Left side of box
            const charY = (config.height / 2) - charSize / 2;

            // Draw current frame of win animation
            if (frameCount > 1) {
                config.ctx.drawImage(
                    winSprite,
                    this.winAnimation.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    charX, charY, charSize, charSize
                );
            } else {
                // Single frame sprite
                config.ctx.drawImage(winSprite, charX, charY, charSize, charSize);
            }
        }
    },
    // Draw result screen
    draw() {
        // Update win animation
        this.updateWinAnimation();

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

        // Box border with color based on performance
        const correctAnswers = Game10Questions.correctAnswers;
        let borderColor = '#ff4b4b'; // Poor performance
        if (correctAnswers >= 8) borderColor = '#58cc02'; // Excellent
        else if (correctAnswers >= 5) borderColor = '#ff9600'; // Good

        config.ctx.strokeStyle = borderColor;
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        // Draw character win animation on the left
        this.drawWinCharacter();

        // Adjust text positions to account for character on left
        const textAreaX = boxX + 250; // Start text after character
        const textCenterX = textAreaX + (boxWidth - 250) / 2;

        // Result title
        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('QUIZ COMPLETED!', textCenterX, boxY + 80);

        // Performance message
        let performanceText = '';
        let performanceEmoji = '';
        if (correctAnswers >= 8) {
            performanceText = 'EXCELLENT!';
            performanceEmoji = '🌟';
        } else if (correctAnswers >= 5) {
            performanceText = 'GOOD JOB!';
            performanceEmoji = '🎉';
        } else {
            performanceText = 'KEEP PRACTICING!';
            performanceEmoji = '💪';
        }

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 20px Arial';
        config.ctx.fillText(`${performanceEmoji} ${performanceText} ${performanceEmoji}`, textCenterX, boxY + 120);

        // Score section
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('Your Score', textCenterX, boxY + 180);

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 42px Arial';
        config.ctx.fillText(`${correctAnswers}/10`, textCenterX, boxY + 230);

        // Accuracy percentage
        const accuracy = Math.round((correctAnswers / 10) * 100);
        config.ctx.fillStyle = '#4a5568';
        config.ctx.font = 'bold 18px Arial';
        config.ctx.fillText(`Accuracy: ${accuracy}%`, textCenterX, boxY + 270);

        // Character name
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        config.ctx.fillStyle = '#666';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText(currentChar ? currentChar.name : 'Unknown', textCenterX, boxY + 300);

        // Buttons
        const buttonWidth = 150;
        const buttonHeight = 60;
        const buttonSpacing = 30;
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
        if (config.gameState !== '10questionsResult') return;

        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            window.location.reload();
        }
    },

    // Handle clicks
    handleClick(e) {
        if (config.gameState !== '10questionsResult') return;

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
            window.location.reload();
        }
    },

    // Result loop
    loop() {
        if (config.gameState === '10questionsResult') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        }
    }
};

const Game10Questions = {
    questionsAnswered: 0,
    maxQuestions: 10,
    correctAnswers: 0,
    currentQuestionNumber: 1,
    endGameTime: null,
    isEndingGame: false,
    lastObstacleCleared: false,

    // Initialize 10 questions mode
    init() {
        console.log('Starting 10 Questions Mode...');
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentQuestionNumber = 1;
        this.endGameTime = null;
        this.isEndingGame = false;
        this.lastObstacleCleared = false;
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
        characterConfig.lastRunningSfxTime = Date.now();

        // Spawn first obstacle
        Game.spawnObstacle();
        lastQuizEnd = Date.now();
        this.setupControls();
        this.loop();
    },

    // Handle correct answer
    handleCorrectAnswer() {
        this.correctAnswers++;
        hasAnsweredCorrectly = true;
        currentScore = this.correctAnswers; // Score = number of correct answers

        console.log(`Correct! Question ${this.currentQuestionNumber}/${this.maxQuestions}, Score: ${this.correctAnswers}`);
        this.nextQuestion();
    },

    // Handle wrong answer - no penalty, just continue
    handleWrongAnswer() {
        console.log(`Wrong answer. Question ${this.currentQuestionNumber}/${this.maxQuestions}, Score: ${this.correctAnswers}`);
        hasAnsweredWrong = true; // Character won't jump but will continue running
        this.nextQuestion();
    },

    // Move to next question
    nextQuestion() {
        this.questionsAnswered++;
        this.currentQuestionNumber = this.currentQuestionNumber >= this.maxQuestions ? this.maxQuestions : this.currentQuestionNumber + 1;

        // Always reset quiz state first
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';

        // Check if we've completed all 10 questions
        if (this.questionsAnswered >= this.maxQuestions) {
            // Don't end game immediately - wait for character to clear the last obstacle
            console.log('All questions answered! Waiting for character to clear last obstacle...');
            return;
        }

        // Set timing for next obstacle spawn
        lastQuizEnd = Date.now();
    },

    // Start end game sequence after clearing last obstacle
    startEndGameSequence() {
        console.log(`Game completed! Final score: ${this.correctAnswers}/${this.maxQuestions}`);

        // Set ending game state with 3 second delay
        this.isEndingGame = true;
        this.endGameTime = Date.now();

        // Play completion sound based on performance
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        if (this.correctAnswers >= 8) {
            // Excellent performance
            AudioManager.playSoundEffect('sounds/success.ogg', 0.7);
        } else if (this.correctAnswers >= 5) {
            // Good performance 
            if (currentChar) {
                const jumpSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-jump.ogg`;
                AudioManager.playSoundEffect(jumpSoundPath, 0.7);
            }
        } else {
            // Poor performance
            if (currentChar) {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.7);
            }
        }

        // Clean up quiz state immediately
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        hasAnsweredCorrectly = false;
        hasAnsweredWrong = false;
        targetObstacle = null;
    },

    // Show final result screen after delay
    showResultScreen() {
        config.gameState = '10questionsResult';
        obstacles = [];

        // Initialize result screen with win animation
        Game10QuestionsResult.init();

        // Setup result screen controls
        document.addEventListener('keydown', Game10QuestionsResult.handleInput.bind(Game10QuestionsResult));
        config.canvas.addEventListener('click', Game10QuestionsResult.handleClick.bind(Game10QuestionsResult));
        Game10QuestionsResult.loop();
    },

    // Draw progress UI for 10 questions mode
    drawProgressUI() {
        if (config.gameState !== 'playing') return;

        // Question progress bar
        const barWidth = 400;
        const barHeight = 20;
        const barX = (config.width - barWidth) / 2;
        const barY = 20;

        // Background bar
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        config.ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 40);

        config.ctx.fillStyle = '#444';
        config.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Progress bar
        const progress = this.questionsAnswered / this.maxQuestions;
        config.ctx.fillStyle = '#4CAF50';
        config.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        // Progress text
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(`Question ${this.currentQuestionNumber}/${this.maxQuestions}`, config.width / 2, barY + barHeight + 25);


        // Show countdown when ending game
        if (this.isEndingGame) {
            const timeElapsed = Date.now() - this.endGameTime;
            const timeLeft = Math.ceil((3000 - timeElapsed) / 1000);

            if (timeLeft > 0) {
                // Semi-transparent overlay
                config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                config.ctx.fillRect(0, 0, config.width, config.height);

                // Completion message
                config.ctx.fillStyle = '#fff';
                config.ctx.font = 'bold 48px Arial';
                config.ctx.textAlign = 'center';
                config.ctx.fillText('Quiz Completed!', config.width / 2, config.height / 2 - 50);

                // Countdown
                config.ctx.fillStyle = '#58cc02';
                config.ctx.font = 'bold 36px Arial';
                config.ctx.fillText(`Showing results in ${timeLeft}...`, config.width / 2, config.height / 2 + 20);

                // Score preview
                config.ctx.fillStyle = '#ff9600';
                config.ctx.font = 'bold 32px Arial';
                config.ctx.fillText(`Final Score: ${this.correctAnswers}/${this.maxQuestions}`, config.width / 2, config.height / 2 + 80);
            }
        }
    },

    // Setup controls for 10 questions mode
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

    // Main game loop for 10 questions mode
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

        // Update game logic (modified for 10 questions)
        this.updateObstacles10Q();
        if (!isGamePaused) {
            Game.updateCharacter();
        }
        this.updateQuiz10Q();

        // Draw everything
        Game.drawBackground();
        Game.drawObstacles();
        Game.drawCharacter();
        Game.drawUI();
        this.drawProgressUI(); // Draw progress specific to 10Q mode

        if (isQuizActive) {
            Quiz.draw();
        }

        // Check if we should show result screen after delay
        if (this.isEndingGame && Date.now() - this.endGameTime >= 3000) {
            this.showResultScreen();
            return;
        }

        if (config.gameState === '10questionsResult') {
            // Result screen is handled by its own module
            return;
        }

        requestAnimationFrame(this.loop.bind(this));
    },

    // Modified obstacle update for 10Q mode
    updateObstacles10Q() {
        const currentTime = Date.now();

        // Only spawn new obstacles if we haven't completed all questions
        if (!isQuizActive && currentTime - lastQuizEnd > OBSTACLE_SPAWN_INTERVAL && this.questionsAnswered < this.maxQuestions) {
            Game.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        // Move obstacles
        obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);

            // Trigger quiz if obstacle is near character and not already jumping or quiz active
            if (obstacle.x < characterConfig.x + QUIZ_TRIGGER_DISTANCE && obstacle.x > characterConfig.x + QUIZ_TRIGGER_DISTANCE - 100 && !characterConfig.isJumping && !isQuizActive && !obstacle.hasTriggeredQuiz && this.questionsAnswered < this.maxQuestions) {
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

            // Jump logic - both correct and wrong answers allow continuation
            if ((hasAnsweredCorrectly || hasAnsweredWrong) && targetObstacle === obstacle && !characterConfig.isJumping) {
                const jumpDistance = 250;
                if (obstacle.x < characterConfig.x + jumpDistance && obstacle.x > characterConfig.x - 50) {
                    if (hasAnsweredCorrectly) {
                        // Jump over fence for correct answer
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
                        // No collision, just continue running
                        console.log('Wrong answer - character runs through the obstacle.');
                        // Play fail sound effect
                        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                        if (currentChar) {
                            const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                            AudioManager.playSoundEffect(failSoundPath, 0.7);
                        }
                        AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
                    }

                    // Check if this is the last question obstacle
                    if (this.questionsAnswered >= this.maxQuestions && !this.lastObstacleCleared) {
                        this.lastObstacleCleared = true;
                        // Small delay to ensure character has visually cleared the obstacle
                        setTimeout(() => {
                            this.startEndGameSequence();
                        }, 500); // 0.5s delay after clearing
                    }

                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // No collision detection for wrong answers in 10Q mode - character passes through
        });

        // Remove off-screen obstacles
        obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
    },

    // Modified quiz timer for 10Q mode
    updateQuiz10Q() {
        if (isQuizActive) {
            const currentTime = Date.now();
            quizTimer = QUIZ_TIME_LIMIT - (currentTime - quizStartTime);
            if (quizTimer <= 0) {
                // Time out counts as wrong answer, but game continues
                console.log('Quiz timeout! Counting as wrong answer.');
                this.handleWrongAnswer();
            }
        }
    }
};