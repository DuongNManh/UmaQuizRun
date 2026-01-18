// 10 Questions Mode - Fixed 10 questions, score based on correct answers
// Wrong answers don't cause game over, just continue to next question

const Game10Questions = {
    questionsAnswered: 0,
    maxQuestions: 10,
    correctAnswers: 0,
    currentQuestionNumber: 1,

    // Initialize 10 questions mode
    init() {
        console.log('Starting 10 Questions Mode...');
        this.questionsAnswered = 0;
        this.correctAnswers = 0;
        this.currentQuestionNumber = 1;
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
        this.currentQuestionNumber++;
        
        // Check if we've completed all 10 questions
        if (this.questionsAnswered >= this.maxQuestions) {
            this.endGame();
            return;
        }
        
        // Reset quiz state for next question
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        lastQuizEnd = Date.now();
    },

    // End game after 10 questions
    endGame() {
        console.log(`Game completed! Final score: ${this.correctAnswers}/${this.maxQuestions}`);
        
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
        
        // Score display
        config.ctx.fillText(`Correct: ${this.correctAnswers}`, config.width / 2, barY + barHeight + 45);
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

        if (config.gameState === 'gameOver') {
            // Switch to game over screen
            document.addEventListener('keydown', GameOver.handleInput.bind(GameOver));
            config.canvas.addEventListener('click', GameOver.handleClick.bind(GameOver));
            GameOver.loop();
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