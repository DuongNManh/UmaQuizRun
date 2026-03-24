// 10 Questions Mode - Fixed 10 questions, score based on correct answers
// Wrong answers don't cause game over, just continue to next question

// Reuse shared result screen from game-core.js
// Game10QuestionsResult is created there by ResultScreenFactory



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
        this.questionIndex = 0;
        this.shuffledQuestions = [...quizData].sort(() => Math.random() - 0.5);
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
        AudioManager.playBackgroundMusic('sounds/bg-10question.ogg', 0.5);
        this.loop();
    },

    // Handle correct answer
    handleCorrectAnswer() {
        this.correctAnswers++;
        hasAnsweredCorrectly = true;
        currentScore = this.correctAnswers * 10;

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
        this.currentQuestionNumber = this.currentQuestionNumber + 1;

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
        AudioManager.stopBackgroundMusic();

        // Initialize result screen with win animation
        Game10QuestionsResult.init();
        Game10QuestionsResult.loop();
    },

    // Draw progress UI for 10 questions mode
    drawProgressUI() {
        if (config.gameState !== 'playing') return;

        UI.drawProgress(this.questionsAnswered, this.maxQuestions);

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
                config.ctx.fillText('Hoàn thành màn chơi!', config.width / 2, config.height / 2 - 50);

                // Countdown
                config.ctx.fillStyle = '#58cc02';
                config.ctx.font = 'bold 36px Arial';
                config.ctx.fillText(`Hiển thị kết quả trong ${timeLeft}...`, config.width / 2, config.height / 2 + 20);

                // Score preview
                config.ctx.fillStyle = '#ff9600';
                config.ctx.font = 'bold 32px Arial';
                config.ctx.fillText(`Điểm cuối cùng: ${currentScore}`, config.width / 2, config.height / 2 + 80);
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
        if (!isQuizActive && currentTime - lastQuizEnd > (window.nextObstacleSpawnInterval || OBSTACLE_SPAWN_INTERVAL) && this.questionsAnswered < this.maxQuestions && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < config.width - 500)) {
            Game.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        // Move obstacles
        obstacles.forEach(obstacle => {
            // Maintain sync between quiz timer and target obstacle impact
            if (isQuizActive && targetObstacle === obstacle) {
                const elapsed = Date.now() - quizStartTime;
                const remainingMs = Math.max(1, quizTimeLimitMs - elapsed);
                const targetX = characterConfig.x + 50;
                const distance = Math.max(0, obstacle.x - targetX);
                if (distance > 0) {
                    const requiredSpeedPerSecond = distance / (remainingMs / 1000);
                    const speedAdjust = requiredSpeedPerSecond * (deltaTime / 1000);
                    obstacle.x -= speedAdjust;
                }
            } else {
                obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);
            }

            QuizManager.triggerIfNeeded(obstacle,
                () => this.questionsAnswered < this.maxQuestions,
                () => this.shuffledQuestions[this.questionIndex++]
            );

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

                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // Clear obstacle if character successfully passed it
            if (obstacle.x < characterConfig.x - 100 && !obstacle.hasBeenProcessed) {
                obstacle.hasBeenProcessed = true;
                // Check if this is the last question obstacle
                if (this.questionsAnswered >= this.maxQuestions && !this.lastObstacleCleared) {
                    this.lastObstacleCleared = true;
                    // Small delay to ensure character has visually cleared the obstacle
                    setTimeout(() => {
                        this.startEndGameSequence();
                    }, 500); // 0.5s delay after clearing
                }
                // Reset quiz-related flags if this was the target obstacle
                if (targetObstacle === obstacle) {
                    hasAnsweredCorrectly = false;
                    hasAnsweredWrong = false;
                    targetObstacle = null;
                }
            }

            // No collision detection for wrong answers in 10Q mode - character passes through
        });

        // Remove off-screen obstacles
        ObstacleManager.cleanup();
    },

    // Modified quiz timer for 10Q mode
    updateQuiz10Q() {
        if (isQuizActive) {
            const currentTime = Date.now();
            quizTimer = quizTimeLimitMs - (currentTime - quizStartTime);
            if (quizTimer <= 0) {
                // Time out counts as wrong answer, but delay popup close to let obstacles move closer
                console.log('Quiz timeout! Counting as wrong answer.');
                this.handleWrongAnswer();
            }
        }
    }
};