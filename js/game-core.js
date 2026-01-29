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
                    AudioManager.playSoundEffect('sounds/running.ogg', 0.1); // Lower volume for background
                    characterConfig.lastRunningSfxTime = currentTime;
                    console.log('Playing running SFX'); // Debug log
                }
            }
        }
    },

    // Draw UI overlay
    drawUI() {
        if (config.gameState !== 'playing') return;

        // Score display
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        config.ctx.fillRect(10, 10, 250, 120);

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.textAlign = 'left';
        config.ctx.fillText('ĐIỂM HIỆN TẠI', 20, 40);

        config.ctx.fillStyle = '#58cc02';
        config.ctx.font = 'bold 28px Arial';
        config.ctx.fillText(`${currentScore}`, 20, 70);

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

        // Move obstacles
        obstacles.forEach(obstacle => {
            obstacle.x -= obstacle.speed * slowFactor * (deltaTime / FIXED_TIME_STEP);

            // Trigger quiz if obstacle is near character and not already jumping or quiz active
            if (obstacle.x < characterConfig.x + QUIZ_TRIGGER_DISTANCE && obstacle.x > characterConfig.x + QUIZ_TRIGGER_DISTANCE - 100 && !characterConfig.isJumping && !isQuizActive && !obstacle.hasTriggeredQuiz) {
                // Start quiz
                currentQuestion = quizData[Math.floor(Math.random() * quizData.length)];
                isQuizActive = true;
                isGamePaused = true;
                quizStartTime = currentTime;

                // Per-question time limit: use duration_in_seconds if provided, else default
                const durationSeconds = currentQuestion.duration_in_seconds || (QUIZ_TIME_LIMIT / 1000);
                slowFactor = SLOW_FACTOR_BY_DURATION[durationSeconds] || 0.20;
                quizTimeLimitMs = durationSeconds * 1000;
                quizTimer = quizTimeLimitMs;
                targetObstacle = obstacle; // Mark this as the target to jump
                obstacle.hasTriggeredQuiz = true; // Mark as triggered to prevent re-triggering
            }

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
                        AudioManager.playSoundEffect(jumpSoundPath, 0.7);
                    }
                    AudioManager.playSoundEffect('sounds/success.ogg', 0.7);

                    hasAnsweredCorrectly = false; // Reset flag
                    hasAnsweredWrong = false; // Reset flag
                    targetObstacle = null;
                }
            }

            // Collision detection - if fence reaches character position without jumping -> Game Over
            if (obstacle.x <= characterConfig.x + 100 && obstacle.x >= characterConfig.x - 50 && !characterConfig.isJumping) {
                console.log('Collision! Game Over.');

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
        });

        // Remove off-screen obstacles
        obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
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
                // Time out, game over
                console.log('Quiz timeout! Game Over.');

                // Play fail sound effects
                // const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                // if (currentChar) {
                //     const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                //     AudioManager.playSoundEffect(failSoundPath, 0.7);
                // }
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