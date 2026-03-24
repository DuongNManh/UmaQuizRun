// Main Game module

// Character sprite configuration
const characterConfig = {
    currentCharacter: 'spe', // Default character
    x: 300,
    y: 0,
    scale: 2.5,
    currentAnimation: 'run',
    frameIndex: 0,
    frameCount: 0,
    frameDelay: 8,
    frameCounter: 0,
    smokeFrameIndex: 0,
    smokeFrameDelay: 15,
    smokeFrameCounter: 0,
    isJumping: false,
    jumpVelocity: 100,
    jumpPower: -20,
    gravity: 0.8,
    paused: false,
    // Running SFX timing
    runningSfxInterval: 1800, // ms between running SFX plays
    lastRunningSfxTime: 0
};

// Background scrolling
const background = {
    x1: 0,
    x2: config.width, // Start second background at right edge for seamless scrolling
    speed: 8
};

// Dynamic spawn interval based on quiz duration
let nextObstacleSpawnInterval = OBSTACLE_SPAWN_INTERVAL;
window.nextObstacleSpawnInterval = nextObstacleSpawnInterval;

// Shared obstacle logic for both modes
const ObstacleManager = {
    spawn() {
        if (assets.backgrounds.fence) {
            obstacles.push({
                x: config.width + 500,
                y: config.groundY + (assets.backgrounds.fence.height / 2),
                speed: background.speed,
                hasTriggeredQuiz: false,
                hasBeenProcessed: false
            });
        }
    },

    draw() {
        if (assets.backgrounds.fence) {
            obstacles.forEach(obstacle => {
                config.ctx.drawImage(assets.backgrounds.fence, obstacle.x, obstacle.y);
            });
        }
    },

    cleanup() {
        obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
    }
};

const QuizManager = {
    triggerIfNeeded(obstacle, shouldTriggerCallback, getQuestionCallback) {
        const currentTime = Date.now();
        if (!obstacle.hasTriggeredQuiz && !characterConfig.isJumping && !isQuizActive && shouldTriggerCallback() && obstacle.x < characterConfig.x + QUIZ_TRIGGER_DISTANCE && obstacle.x > characterConfig.x + QUIZ_TRIGGER_DISTANCE - 100) {
            currentQuestion = getQuestionCallback ? getQuestionCallback() : quizData[Math.floor(Math.random() * quizData.length)];
            isQuizActive = true;
            isGamePaused = true;
            quizStartTime = currentTime;

            const durationSeconds = currentQuestion.duration_in_seconds || (QUIZ_TIME_LIMIT / 1000);
            slowFactor = SLOW_FACTOR_BY_DURATION[durationSeconds] || 0.20;
            quizTimeLimitMs = durationSeconds * 1000;
            quizTimer = quizTimeLimitMs;
            targetObstacle = obstacle;
            obstacle.hasTriggeredQuiz = true;
        }
    },

    reset() {
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        quizTimer = 0;
        quizTimeLimitMs = QUIZ_TIME_LIMIT;
        targetObstacle = null;
    },

    updateTimer(onTimeout) {
        if (!isQuizActive) return;

        const currentTime = Date.now();
        quizTimer = quizTimeLimitMs - (currentTime - quizStartTime);
        if (quizTimer <= 0) {
            onTimeout?.();
            this.reset();
        }
    }
};

const UI = {
    drawScoreBox() {
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        config.ctx.fillRect(50, 50, 250, 100);

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.textAlign = 'left';
        config.ctx.fillText('ĐIỂM HIỆN TẠI', 70, 90);

        config.ctx.fillStyle = '#58cc02';
        config.ctx.font = 'bold 28px Arial';
        config.ctx.fillText(`${currentScore}`, 70, 120);
    },

    drawProgress(current, max) {
        const barWidth = 400;
        const barHeight = 20;
        const barX = (config.width - barWidth) / 2;
        const barY = 60;

        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        config.ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 40);
        config.ctx.fillStyle = '#444';
        config.ctx.fillRect(barX, barY, barWidth, barHeight);

        const progress = current / max;
        config.ctx.fillStyle = '#4CAF50';
        config.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(`Câu hỏi ${Math.min(current, max)}/${max}`, config.width / 2, barY + barHeight + 25);
    },

    drawHearts(hearts, maxHearts) {
        const heartSize = 40;
        const heartSpacing = 50;
        const startX = config.width - (maxHearts * heartSpacing) - 40;
        const startY = 50;

        for (let i = 0; i < maxHearts; i++) {
            const x = startX + i * heartSpacing;
            config.ctx.font = `${heartSize}px Arial`;
            config.ctx.textAlign = 'center';
            config.ctx.fillStyle = i < hearts ? '#ff0000' : '#8a8a8a';
            config.ctx.fillText('❤', x, startY + heartSize / 2);
        }
    },

    drawResultBox({ borderColor, title, message, score, characterName }) {
        const boxWidth = 700;
        const boxHeight = 550;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        config.ctx.fillRect(0, 0, config.width, config.height);

        config.ctx.fillStyle = '#fff';
        config.ctx.beginPath();
        config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        config.ctx.fill();

        config.ctx.strokeStyle = borderColor;
        config.ctx.lineWidth = 4;
        config.ctx.stroke();

        const textAreaX = boxX + 250;
        const textCenterX = textAreaX + (boxWidth - 250) / 2;

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(title, textCenterX, boxY + 80);

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 20px Arial';
        config.ctx.fillText(message, textCenterX, boxY + 120);

        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('Điểm của bạn', textCenterX, boxY + 180);

        config.ctx.fillStyle = borderColor;
        config.ctx.font = 'bold 42px Arial';
        config.ctx.fillText(`${score}`, textCenterX, boxY + 230);

        config.ctx.fillStyle = '#666';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText(characterName, textCenterX, boxY + 300);

        const buttonWidth = 150;
        const buttonHeight = 60;
        const menuButtonX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 120;

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

        return { boxX, boxY, boxWidth, boxHeight, menuButtonX, buttonY, buttonWidth, buttonHeight };
    },

    getResultBoxMetrics() {
        const boxWidth = 700;
        const boxHeight = 550;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;
        const buttonWidth = 150;
        const buttonHeight = 60;
        const menuButtonX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 120;

        return { boxX, boxY, boxWidth, boxHeight, menuButtonX, buttonY, buttonWidth, buttonHeight };
    }
};

const ResultScreenFactory = {
    create({ stateKey, borderColor, title, message, getScore, getCharacterName, getAnimationSprite, animationType, onPlaySound }) {
        const result = {
            stateKey,
            animation: {
                frameIndex: 0,
                frameCounter: 0,
                frameDelay: 20,
                lastFrameTime: Date.now(),
                isComplete: false,
                hasPlayedSound: false
            },
            init() {
                this.animation.frameIndex = 0;
                this.animation.frameCounter = 0;
                this.animation.lastFrameTime = Date.now();
                this.animation.isComplete = false;
                this.animation.hasPlayedSound = false;

                document.addEventListener('keydown', this.handleInput.bind(this));
                config.canvas.addEventListener('click', this.handleClick.bind(this));
            },
            handleInput(e) {
                if (config.gameState !== stateKey) return;
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                    window.location.reload();
                }
            },
            handleClick(e) {
                if (config.gameState !== stateKey) return;
                const rect = config.canvas.getBoundingClientRect();
                const scaleX = config.canvas.width / rect.width;
                const scaleY = config.canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX / config.scale;
                const y = (e.clientY - rect.top) * scaleY / config.scale;
                const offsetX = (config.canvas.width / config.scale - config.width) / 2;
                const offsetY = (config.canvas.height / config.scale - config.height) / 2;
                const adjustedX = x - offsetX;
                const adjustedY = y - offsetY;

                const metrics = UI.getResultBoxMetrics();

                if (!metrics) return;
                if (adjustedX >= metrics.menuButtonX && adjustedX <= metrics.menuButtonX + metrics.buttonWidth && adjustedY >= metrics.buttonY && adjustedY <= metrics.buttonY + metrics.buttonHeight) {
                    window.location.reload();
                }
            },
            draw() {
                if (config.gameState !== stateKey) return;

                const score = getScore();
                const characterName = getCharacterName();

                UI.drawResultBox({
                    borderColor,
                    title,
                    message,
                    score,
                    characterName
                });

                const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                const sprite = getAnimationSprite ? getAnimationSprite(currentChar, animationType) : null;

                // Play sound once, at first frame of animation
                if (!this.animation.hasPlayedSound && onPlaySound) {
                    if (this.animation.frameIndex === 0) {
                        onPlaySound(currentChar, score);
                        this.animation.hasPlayedSound = true;
                    }
                }

                if (sprite && sprite.complete) {
                    const frameHeight = sprite.height;
                    const frameWidth = frameHeight;
                    const frameCount = Math.floor(sprite.width / frameWidth);

                    const now = Date.now();
                    if (!this.animation.isComplete && now - this.animation.lastFrameTime > this.animation.frameDelay * 16) {
                        this.animation.frameIndex++;
                        if (this.animation.frameIndex >= frameCount) {
                            this.animation.frameIndex = frameCount - 1;
                            this.animation.isComplete = true;
                        }
                        this.animation.lastFrameTime = now;
                    }

                    const boxWidth = 700;
                    const boxX = (config.width - boxWidth) / 2;
                    const charSize = 180;
                    const charX = boxX + 50;
                    const charY = (config.height / 2) - charSize / 2;

                    if (frameCount > 1) {
                        config.ctx.drawImage(
                            sprite,
                            this.animation.frameIndex * frameWidth,
                            0,
                            frameWidth,
                            frameHeight,
                            charX,
                            charY,
                            charSize,
                            charSize
                        );
                    } else {
                        config.ctx.drawImage(sprite, charX, charY, charSize, charSize);
                    }
                }
            },
            loop() {
                if (config.gameState === stateKey) {
                    this.draw();
                    requestAnimationFrame(this.loop.bind(this));
                }
            }
        };

        return result;
    }
};

const Game10QuestionsResult = ResultScreenFactory.create({
    stateKey: '10questionsResult',
    borderColor: '#58cc02',
    title: 'HOÀN THÀNH!',
    message: 'Bạn đã hoàn thành thử thách',
    getScore: () => currentScore,
    getCharacterName: () => {
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        return currentChar ? currentChar.name : 'Unknown';
    },
    getAnimationSprite: (currentChar, animationType) => {
        if (!currentChar) return null;
        return assets.characters[currentChar.id]?.win;
    },
    onPlaySound: (currentChar, score) => {
        if (currentChar) {
            const winSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-win.ogg`;
            AudioManager.playSoundEffect(winSoundPath, 0.5);
        }

        // Fallback to generic win sound for reliability
        AudioManager.playSoundEffect('sounds/success.ogg', 0.7);
    }
});

const GameEndlessResult = ResultScreenFactory.create({
    stateKey: 'endlessGameOver',
    borderColor: '#ff4b4b',
    title: 'GAME OVER!',
    message: 'Hết máu rồi',
    getScore: () => currentScore,
    getCharacterName: () => {
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        return currentChar ? currentChar.name : 'Unknown';
    },
    getAnimationSprite: (currentChar, animationType) => {
        if (!currentChar) return null;
        // Use win animation on endless result to mimic pre-refactor behavior
        return assets.characters[currentChar.id]?.win;
    },
    onPlaySound: (currentChar, score) => {
        if (currentChar) {
            if (score >= 50) {
                const winSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-win.ogg`;
                AudioManager.playSoundEffect(winSoundPath, 0.5);
            } else {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.5);
                AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);
            }
        }
    }
});

const Game = {
    // Draw scrolling background
    drawBackground() {
        if (assets.backgrounds.bg1) {
            // Draw first background (normal)
            config.ctx.drawImage(assets.backgrounds.bg1, background.x1, 0, config.width, config.height);

            // Draw second background (flipped for seamless effect)
            config.ctx.save();
            config.ctx.translate(background.x2, 0);
            config.ctx.scale(-1, 1);
            config.ctx.drawImage(assets.backgrounds.bg1, -config.width, 0, config.width, config.height);
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

    // Draw character sprite
    drawCharacter() {
        const char = characterConfig.currentCharacter;
        const anim = characterConfig.currentAnimation;
        const sprite = assets.characters[char][anim];

        if (sprite && sprite.complete) {
            const frameHeight = sprite.height;
            const frameWidth = frameHeight; // Assuming square frames
            const frameCount = Math.floor(sprite.width / frameWidth);

            // Update frame animation only if not paused
            if (!characterConfig.paused) {
                const effectiveFrameDelay = characterConfig.frameDelay / slowFactor;
                characterConfig.frameCounter += (deltaTime / FIXED_TIME_STEP);
                if (characterConfig.frameCounter >= effectiveFrameDelay) {
                    characterConfig.frameCounter = 0;
                    characterConfig.frameIndex = (characterConfig.frameIndex + 1) % frameCount;
                }
            }

            // Draw current frame
            config.ctx.drawImage(
                sprite,
                characterConfig.frameIndex * frameWidth, 0, frameWidth, frameHeight,
                characterConfig.x, characterConfig.y,
                frameWidth * characterConfig.scale, frameHeight * characterConfig.scale
            );

            // Draw smoke effect under character's feet if running or boosting
            if ((anim === 'run' || anim === 'boost') && assets.effects.smoke) {
                const smokeSprite = assets.effects.smoke;
                if (smokeSprite && smokeSprite.complete) {
                    const smokeFrameWidth = smokeSprite.width / SMOKE_FRAME_COUNT;
                    const smokeFrameHeight = smokeSprite.height;
                    const smokeX = characterConfig.x + (frameWidth * characterConfig.scale) - smokeFrameWidth;
                    const smokeY = characterConfig.y + frameHeight * characterConfig.scale - smokeFrameHeight;
                    config.ctx.drawImage(
                        smokeSprite,
                        characterConfig.smokeFrameIndex * smokeFrameWidth, 0, smokeFrameWidth, smokeFrameHeight,
                        smokeX, smokeY, smokeFrameWidth, smokeFrameHeight
                    );
                }

                // Update smoke frame animation
                const effectiveSmokeDelay = characterConfig.smokeFrameDelay / slowFactor;
                characterConfig.smokeFrameCounter += (deltaTime / FIXED_TIME_STEP);
                if (characterConfig.smokeFrameCounter >= effectiveSmokeDelay) {
                    characterConfig.smokeFrameCounter = 0;
                    characterConfig.smokeFrameIndex = (characterConfig.smokeFrameIndex + 1) % SMOKE_FRAME_COUNT;
                }
            }

            // Play running SFX when character is running (not jumping, not paused)
            if (anim === 'run' && !characterConfig.isJumping && !characterConfig.paused) {
                const currentTime = Date.now();
                if (currentTime - characterConfig.lastRunningSfxTime > characterConfig.runningSfxInterval) {
                    AudioManager.playSoundEffect('sounds/running.ogg', 0.2); // Lower volume for background
                    characterConfig.lastRunningSfxTime = currentTime;
                }
            }
        }
    },

    // Draw UI overlay
    drawUI() {
        if (config.gameState !== 'playing') return;

        UI.drawScoreBox();

        // Draw any active quiz answer effects on top of UI
        if (typeof Quiz !== 'undefined' && Quiz.drawEffects) {
            Quiz.drawEffects();
        }
    },

    // Spawn a new obstacle (fence)
    spawnObstacle() {
        if (assets.backgrounds.fence) {
            obstacles.push({
                x: config.width + 500,
                y: config.groundY + (assets.backgrounds.fence.height / 2),
                speed: background.speed,
                hasTriggeredQuiz: false
            });
        }
    },

    // Draw obstacles
    drawObstacles() {
        if (assets.backgrounds.fence) {
            obstacles.forEach(obstacle => {
                config.ctx.drawImage(assets.backgrounds.fence, obstacle.x, obstacle.y);
            });
        }
    },

    // Update obstacles
    updateObstacles() {
        const currentTime = Date.now();
        if (!isQuizActive && currentTime - lastQuizEnd > window.nextObstacleSpawnInterval && (obstacles.length === 0 || obstacles[obstacles.length - 1].x < config.width - 500)) {
            this.spawnObstacle();
            lastQuizEnd = currentTime;
        }

        obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);

            // Reusable quiz trigger path
            QuizManager.triggerIfNeeded(obstacle, () => true);

            // Jump when answered correctly and obstacle is close (but not if answered wrong)
            if (hasAnsweredCorrectly && !hasAnsweredWrong && targetObstacle === obstacle && !characterConfig.isJumping) {
                const jumpDistance = 250; // Distance at which to jump
                if (obstacle.x < characterConfig.x + jumpDistance && obstacle.x > characterConfig.x - 50) {
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
                        AudioManager.playSoundEffect(jumpSoundPath, 0.5);
                    }
                    AudioManager.playSoundEffect('sounds/success.ogg', 0.7);

                    hasAnsweredCorrectly = false; // Reset flag
                    hasAnsweredWrong = false; // Reset flag
                    targetObstacle = null;
                }
            }

            // Collision detection - if fence reaches character position without jumping -> Game Over
            if (obstacle.x <= characterConfig.x + 100 && obstacle.x >= characterConfig.x - 50 && !characterConfig.isJumping) {
                // Play fail sound effects
                const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                if (currentChar) {
                    const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                    AudioManager.playSoundEffect(failSoundPath, 0.7);
                }
                AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);

                config.gameState = 'gameOver';
                obstacles = [];
                QuizManager.reset();
                hasAnsweredCorrectly = false;
                hasAnsweredWrong = false;
            }
        });

        ObstacleManager.cleanup();
    },

    // Update character (for jumping)
    updateCharacter() {
        if (characterConfig.isJumping) {
            const dt = deltaTime / FIXED_TIME_STEP;
            characterConfig.y += characterConfig.jumpVelocity * dt;
            characterConfig.jumpVelocity += characterConfig.gravity * dt;

            // Land on ground
            if (characterConfig.y >= config.groundY) {
                characterConfig.y = config.groundY;
                characterConfig.isJumping = false;
                characterConfig.paused = false;
                characterConfig.currentAnimation = 'run';
                characterConfig.frameIndex = 0;
            }
        }
    },

    // Update quiz timer
    updateQuiz() {
        if (isQuizActive) {
            const currentTime = Date.now();
            quizTimer = QUIZ_TIME_LIMIT - (currentTime - quizStartTime);
            if (quizTimer <= 0) {
                AudioManager.playSoundEffect('sounds/fail.ogg', 0.7);

                // Game over due to timeout
                config.gameState = 'gameOver';
                obstacles = []; // Clear obstacles
                isQuizActive = false;
                isGamePaused = false;
                slowFactor = 1;
                currentQuestion = null;
                quizInput = '';
                hasAnsweredCorrectly = false;
                hasAnsweredWrong = false;
                targetObstacle = null;
                lastQuizEnd = currentTime;
            }
        }
    },

    // Main game loop
    loop(currentTime = 0) {
        // Calculate delta time
        if (lastFrameTime === 0) {
            lastFrameTime = currentTime;
        }
        deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;

        config.ctx.clearRect(0, 0, config.width, config.height);
        this.updateObstacles();
        if (!isGamePaused) {
            this.updateCharacter();
        }
        this.updateQuiz();

        // Draw everything
        this.drawBackground();
        this.drawObstacles();
        this.drawCharacter();
        this.drawUI();
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

    // Handle keyboard input during gameplay
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
                        window.location.reload();
                        break;
                }
            }
        });
    },

    // Start the appropriate game mode
    start() {
        console.log('Starting game with mode:', currentGameMode);

        if (currentGameMode === GAME_MODES.RANDOM_10) {
            Game10Questions.init();
        } else if (currentGameMode === GAME_MODES.ENDLESS) {
            GameEndless.init();
        } else {
            console.error('Unknown game mode:', currentGameMode);
        }
    }
};