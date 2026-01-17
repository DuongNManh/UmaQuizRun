// Game Configuration
const config = {
    canvas: null,
    ctx: null,
    width: 1850,
    height: 1000,
    scale: 1,
    groundY: 0,
    gameState: 'loading'
};

// Available characters with their metadata
const CHARACTERS = [
    // { id: 'cb', name: 'MR.C.B', folder: 'CB', prefix: 'cb' }, // kho
    { id: 'daiwa', name: 'Daiwa Scarlet', folder: 'Daiwa', prefix: 'daiwa' }, // roi
    // { id: 'dia', name: 'Dia', folder: 'Dia', prefix: 'dia' }, // kho
    { id: 'goldship', name: 'Gold Ship', folder: 'GoldShip', prefix: 'gs' }, // roi
    { id: 'grass', name: 'Grass Wonder', folder: 'Grass', prefix: 'gw' }, // roi
    { id: 'kitasan', name: 'Kitasan Black', folder: 'Kitasan', prefix: 'kita' }, // roi
    { id: 'mcqueen', name: 'Mejiro McQueen', folder: 'McQueen', prefix: 'mq' }, // roi
    { id: 'oguri', name: 'Oguri Cap', folder: 'Oguri', prefix: 'oguri' }, // roi
    // { id: 'rudolf', name: 'Symboli Rudolf', folder: 'Rudolf', prefix: 'rudolf' }, // kho
    { id: 'spe', name: 'Special Week', folder: 'Spe', prefix: 'spe' }, // roi
    // { id: 'sunday', name: 'Marvelous Sunday', folder: 'Sunday', prefix: 'sunday' }, // kho
    { id: 'suzuka', name: 'Silence Suzuka', folder: 'Suzuka', prefix: 'suzuka' }, // roi
    { id: 'tachyon', name: 'Agnes Tachyon', folder: 'Tachyon', prefix: 'tachyon' }, // roi
    { id: 'teio', name: 'Tokai Teio', folder: 'Teio', prefix: 'teio' }, // roi
    { id: 'vodka', name: 'Vodka', folder: 'Vodka', prefix: 'vodka' }, // roi
];

// Animation types
const ANIMATION_TYPES = ['run', 'boost', 'idle', 'win'];

// Smoke effect configuration
const SMOKE_FRAME_COUNT = 6;

// Assets to load
const assets = {
    backgrounds: {
        bg1: null,
        bg2: null,
        fence: null
    },
    characters: {},
    effects: {
        smoke: null
    },
    loaded: 0,
    total: 0
};

// Initialize empty character slots
CHARACTERS.forEach(char => {
    assets.characters[char.id] = {
        run: null,
        boost: null,
        idle: null,
        win: null,
        portrait: null
    };
});

// Character sprite configuration
const characterConfig = {
    currentCharacter: 'spe', // Default character
    x: 500,
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
    paused: false
};

// Background scrolling
const background = {
    x1: 0,
    x2: 0,
    speed: 8
};


const QUIZ_TRIGGER_DISTANCE = 1100; // Distance from character to trigger quiz

// Quiz data
let quizData = [];

let currentQuestion = null;
let quizTimer = 0;
const QUIZ_TIME_LIMIT = 10000; // 10 seconds
let isQuizActive = false;
let quizStartTime = 0;
let quizInput = '';
let isGamePaused = false;
let slowFactor = 1; // Normal speed

// Obstacles (fences)
let obstacles = [];
const OBSTACLE_SPAWN_INTERVAL = 5000; // 5 seconds after quiz ends
let lastQuizEnd = 0;

// Scoring system
let currentScore = 0;
let highScore = localStorage.getItem('gameHighScore') ? parseInt(localStorage.getItem('gameHighScore')) : 0;

// Load quiz data from JSON
async function loadQuizData() {
    try {
        const response = await fetch('js/quizData.json');
        if (!response.ok) {
            throw new Error('Failed to load quiz data');
        }
        quizData = await response.json();
        console.log('Quiz data loaded:', quizData);
    } catch (error) {
        console.error('Error loading quiz data:', error);
        // Fallback to empty array or default
        quizData = [];
    }
}
// Load all assets
function loadAssets() {
    const imagesToLoad = [
        // Backgrounds
        { key: 'bg1', path: 'assets/background/bg-1.png', category: 'backgrounds' },
        { key: 'bg2', path: 'assets/background/bg-2.png', category: 'backgrounds' },
        { key: 'fence', path: 'assets/background/fence_00.png', category: 'backgrounds' },

        // Run smoke effects (sprite sheet)
        { key: 'sheet', path: 'assets/run/run_smoke_sheet.png', category: 'effects', effect: 'smoke' }
    ];

    // Dynamically add all characters
    CHARACTERS.forEach(char => {
        ANIMATION_TYPES.forEach(animType => {
            imagesToLoad.push({
                key: animType,
                path: `assets/characters/${char.folder}/${char.prefix}-${animType}.png`,
                category: 'characters',
                character: char.id
            });
        });

        // Add portrait (using idle or main image)
        imagesToLoad.push({
            key: 'portrait',
            path: `assets/characters/${char.folder}/${char.prefix}-idle.png`,
            category: 'characters',
            character: char.id
        });
    });

    assets.total = imagesToLoad.length;

    imagesToLoad.forEach(imageInfo => {
        const img = new Image();
        img.onload = () => {
            assets.loaded++;
            if (assets.loaded === assets.total) {
                background.x2 = config.width;
                config.gameState = 'characterSelect';
                startCharacterSelection();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load: ${imageInfo.path}`);
            assets.loaded++;
            if (assets.loaded === assets.total) {
                config.gameState = 'characterSelect';
                startCharacterSelection();
            }
        };
        img.src = imageInfo.path;

        // Store the loaded image in the correct location
        if (imageInfo.category === 'backgrounds') {
            assets.backgrounds[imageInfo.key] = img;
        } else if (imageInfo.category === 'characters') {
            assets.characters[imageInfo.character][imageInfo.key] = img;
        } else if (imageInfo.category === 'effects') {
            if (imageInfo.effect === 'smoke') {
                assets.effects.smoke = img;
            }
        }
    });
}

// Draw loading screen
function drawLoadingScreen() {
    config.ctx.fillStyle = '#1a1a2e';
    config.ctx.fillRect(0, 0, config.width, config.height);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '24px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText('Loading Assets...', config.width / 2, config.height / 2 - 20);

    // Progress bar
    const barWidth = 300;
    const barHeight = 30;
    const barX = (config.width - barWidth) / 2;
    const barY = config.height / 2 + 10;

    config.ctx.strokeStyle = '#fff';
    config.ctx.strokeRect(barX, barY, barWidth, barHeight);

    const progress = assets.loaded / assets.total;
    config.ctx.fillStyle = '#4CAF50';
    config.ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * progress, barHeight - 4);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '16px Arial';
    config.ctx.fillText(`${assets.loaded} / ${assets.total}`, config.width / 2, barY + 20);
}

// Draw scrolling background
function drawBackground() {
    if (assets.backgrounds.bg1) {
        // Draw first background (normal)
        config.ctx.drawImage(assets.backgrounds.bg1, background.x1, 0, config.width, config.height);

        // Draw second background (flipped for seamless effect)
        config.ctx.save();
        config.ctx.translate(background.x2 + config.width, 0);
        config.ctx.scale(-1, 1);
        config.ctx.drawImage(assets.backgrounds.bg1, 0, 0, config.width, config.height);
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
}

// Draw character sprite
function drawCharacter() {
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
    }
}

// Draw UI overlay
function drawUI() {
    if (config.gameState !== 'playing') return;

    // Score display
    config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    config.ctx.fillRect(10, 10, 250, 120);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = 'bold 24px Arial';
    config.ctx.textAlign = 'left';
    config.ctx.fillText('SCORE', 20, 40);

    config.ctx.fillStyle = '#58cc02';
    config.ctx.font = 'bold 28px Arial';
    config.ctx.fillText(`${currentScore}`, 20, 70);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '16px Arial';
    config.ctx.fillText(`High Score: ${highScore}`, 20, 95);
    config.ctx.fillText(`FPS: ${fps}`, 20, 115);

    // Current character info
    const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
    config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    config.ctx.fillRect(config.width - 310, 10, 300, 60);
    config.ctx.fillStyle = '#fff';
    config.ctx.font = '18px Arial';
    config.ctx.textAlign = 'left';
    config.ctx.fillText(`Character: ${currentChar ? currentChar.name : 'Unknown'}`, config.width - 300, 35);
    config.ctx.fillText(`Animation: ${characterConfig.currentAnimation}`, config.width - 300, 60);
}

// Spawn a new obstacle (fence)
function spawnObstacle() {
    if (assets.backgrounds.fence) {
        obstacles.push({
            x: config.width,
            y: config.groundY + (assets.backgrounds.fence.height / 2),
            speed: background.speed,
            hasTriggeredQuiz: false
        });
    }
}

// Update obstacles
function updateObstacles() {
    const currentTime = Date.now();
    if (!isQuizActive && currentTime - lastQuizEnd > OBSTACLE_SPAWN_INTERVAL) {
        spawnObstacle();
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

        // Jump when answered correctly and obstacle is close
        if (hasAnsweredCorrectly && targetObstacle === obstacle && !characterConfig.isJumping) {
            const jumpDistance = 250; // Distance at which to jump
            if (obstacle.x < characterConfig.x + jumpDistance && obstacle.x > characterConfig.x - 50) {
                characterConfig.isJumping = true;
                characterConfig.jumpVelocity = characterConfig.jumpPower;
                characterConfig.paused = true;
                characterConfig.currentAnimation = 'run';
                characterConfig.frameIndex = 3;

                // Play jump sound effect
                const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
                if (currentChar) {
                    const jumpSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-jump.ogg`;
                    AudioManager.playSoundEffect(jumpSoundPath, 0.7);
                }

                hasAnsweredCorrectly = false; // Reset flag
                targetObstacle = null;
            }
        }

        // Collision detection - if fence reaches character position without jumping -> Game Over
        if (obstacle.x <= characterConfig.x + 100 && obstacle.x >= characterConfig.x - 50 && !characterConfig.isJumping) {
            console.log('Collision! Game Over.');

            // Play fail sound effect
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            if (currentChar) {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.7);
            }

            config.gameState = 'gameOver';
            obstacles = [];
            isQuizActive = false;
            isGamePaused = false;
            slowFactor = 1;
            currentQuestion = null;
            quizInput = '';
            hasAnsweredCorrectly = false;
            targetObstacle = null;
        }
    });

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obstacle => obstacle.x > -assets.backgrounds.fence.width);
}

// Update character (for jumping)
function updateCharacter() {
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
}

// Update quiz timer
function updateQuiz() {
    if (isQuizActive) {
        const currentTime = Date.now();
        quizTimer = QUIZ_TIME_LIMIT - (currentTime - quizStartTime);
        if (quizTimer <= 0) {
            // Time out, game over
            console.log('Quiz timeout! Game Over.');

            // Play fail sound effect
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            if (currentChar) {
                const failSoundPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-fail.ogg`;
                AudioManager.playSoundEffect(failSoundPath, 0.7);
            }

            // Game over due to timeout
            config.gameState = 'gameOver';
            obstacles = []; // Clear obstacles
            isQuizActive = false;
            isGamePaused = false;
            slowFactor = 1;
            currentQuestion = null;
            quizInput = '';
            hasAnsweredCorrectly = false;
            targetObstacle = null;
            lastQuizEnd = currentTime;
        }
    }
}

// Draw quiz UI
function drawQuiz() {
    if (!currentQuestion) return;

    // Semi-transparent overlay with Duolingo green
    config.ctx.fillStyle = 'rgba(0, 8, 2, 0.81)';
    config.ctx.fillRect(0, 0, config.width, config.height);

    // Quiz box - Duolingo style (rounded rectangle)
    const boxWidth = 1000;
    const boxHeight = 600;
    const boxX = (config.width - boxWidth) / 2;
    const boxY = (config.height - boxHeight) / 2;

    // Draw rounded rectangle background
    config.ctx.fillStyle = '#fff';
    config.ctx.beginPath();
    config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
    config.ctx.fill();

    // Border
    config.ctx.strokeStyle = '#00000093';
    config.ctx.lineWidth = 4;
    config.ctx.stroke();

    // Question text with Duolingo styling
    config.ctx.fillStyle = '#2d3748';
    config.ctx.font = 'bold 28px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText(currentQuestion.question, config.width / 2, boxY + 80);

    if (currentQuestion.type === 'multiple_choice') {
        // Draw Duolingo-style option buttons in 2x2 grid
        const buttonColors = ['#58cc02', '#ff9600', '#ff4b4b', '#1cb0f6'];
        const buttonWidth = 320;
        const buttonHeight = 100;
        const buttonSpacing = 20;
        const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
        const startY = boxY + 150;

        currentQuestion.options.forEach((option, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const buttonX = startX + col * (buttonWidth + buttonSpacing);
            const buttonY = startY + row * (buttonHeight + buttonSpacing);

            // Button background with rounded corners
            config.ctx.fillStyle = buttonColors[index % buttonColors.length];
            config.ctx.beginPath();
            config.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
            config.ctx.fill();

            // Button border
            config.ctx.strokeStyle = '#fff';
            config.ctx.lineWidth = 2;
            config.ctx.stroke();

            // Button text
            config.ctx.fillStyle = '#fff';
            config.ctx.font = 'bold 20px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(option, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 7);
        });
    } else if (currentQuestion.type === 'text_input') {
        // Input box with Duolingo styling
        const inputBoxWidth = 400;
        const inputBoxHeight = 60;
        const inputBoxX = (config.width - inputBoxWidth) / 2;
        const inputBoxY = boxY + 200;

        // Input box background
        config.ctx.fillStyle = '#f7fafc';
        config.ctx.beginPath();
        config.ctx.roundRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight, 10);
        config.ctx.fill();

        // Input box border (highlight if focused)
        config.ctx.strokeStyle = '#cbd5e0';
        config.ctx.lineWidth = 2;
        config.ctx.stroke();

        // Input text
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.textAlign = 'center';
        const displayText = quizInput || 'Click here to type...';
        config.ctx.fillStyle = quizInput ? '#2d3748' : '#9ca3af';
        config.ctx.fillText(displayText, inputBoxX + inputBoxWidth / 2, inputBoxY + inputBoxHeight / 2 + 8);
    }

    // Timer with Duolingo styling
    const timeLeft = Math.ceil(quizTimer / 1000);
    const timerColor = timeLeft <= 5 ? '#ff4b4b' : '#58cc02';
    config.ctx.fillStyle = timerColor;
    config.ctx.font = 'bold 36px Arial';
    config.ctx.fillText(`⏱️ ${timeLeft}s`, config.width / 2, boxY + boxHeight - 100);

    // Instructions
    config.ctx.fillStyle = '#4a5568';
    config.ctx.font = '18px Arial';
    if (currentQuestion.type === 'multiple_choice') {
        config.ctx.fillText('Click on the correct answer', config.width / 2, boxY + boxHeight - 40);
    } else {
        config.ctx.fillText('Type the correct answer and press Enter', config.width / 2, boxY + boxHeight - 40);
    }
}

// Draw obstacles
function drawObstacles() {
    if (assets.backgrounds.fence) {
        obstacles.forEach(obstacle => {
            config.ctx.drawImage(assets.backgrounds.fence, obstacle.x, obstacle.y);
        });
    }
}

// Draw game over screen
function drawGameOverScreen() {
    // Duolingo-style gradient background
    const gradient = config.ctx.createLinearGradient(0, 0, config.width, config.height);
    gradient.addColorStop(0, '#6E6565A6');
    gradient.addColorStop(1, '#646464AD');
    config.ctx.fillStyle = gradient;
    config.ctx.fillRect(0, 0, config.width, config.height);

    // Game Over popup box
    const boxWidth = 600;
    const boxHeight = 500;
    const boxX = (config.width - boxWidth) / 2;
    const boxY = (config.height - boxHeight) / 2;

    // Box background
    config.ctx.fillStyle = '#fff';
    config.ctx.beginPath();
    config.ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
    config.ctx.fill();

    // Box border
    config.ctx.strokeStyle = '#ff4b4b';
    config.ctx.lineWidth = 4;
    config.ctx.stroke();

    // Game Over title
    config.ctx.fillStyle = '#ff4b4b';
    config.ctx.font = 'bold 48px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText('GAME OVER', config.width / 2, boxY + 80);

    // Score section
    config.ctx.fillStyle = '#2d3748';
    config.ctx.font = 'bold 24px Arial';
    config.ctx.fillText('Your Score', config.width / 2, boxY + 140);

    config.ctx.fillStyle = '#58cc02';
    config.ctx.font = 'bold 36px Arial';
    config.ctx.fillText(`${currentScore}`, config.width / 2, boxY + 180);

    // High score section
    config.ctx.fillStyle = '#2d3748';
    config.ctx.font = 'bold 20px Arial';
    config.ctx.fillText('High Score', config.width / 2, boxY + 220);

    const isNewHighScore = currentScore === highScore && currentScore > 0;
    config.ctx.fillStyle = isNewHighScore ? '#ff9600' : '#4a5568';
    config.ctx.font = isNewHighScore ? 'bold 28px Arial' : '24px Arial';
    config.ctx.fillText(`${highScore}`, config.width / 2, boxY + 250);

    if (isNewHighScore) {
        config.ctx.fillStyle = '#ff9600';
        config.ctx.font = 'bold 16px Arial';
        config.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', config.width / 2, boxY + 275);
    }

    // Buttons
    const buttonWidth = 220;
    const buttonHeight = 80;
    const buttonSpacing = 30;
    const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
    const buttonY = boxY + boxHeight - 100;

    // Play Again button
    config.ctx.fillStyle = '#58cc02';
    config.ctx.beginPath();
    config.ctx.roundRect(startX, buttonY, buttonWidth, buttonHeight, 15);
    config.ctx.fill();
    config.ctx.strokeStyle = '#fff';
    config.ctx.lineWidth = 2;
    config.ctx.stroke();

    config.ctx.fillStyle = '#fff';
    config.ctx.font = 'bold 18px Arial';
    config.ctx.fillText('PLAY AGAIN', startX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);

    // Character Select button
    const selectButtonX = startX + buttonWidth + buttonSpacing;
    config.ctx.fillStyle = '#6b7280';
    config.ctx.beginPath();
    config.ctx.roundRect(selectButtonX, buttonY, buttonWidth, buttonHeight, 15);
    config.ctx.fill();
    config.ctx.strokeStyle = '#fff';
    config.ctx.lineWidth = 2;
    config.ctx.stroke();

    config.ctx.fillStyle = '#fff';
    config.ctx.font = 'bold 18px Arial';
    config.ctx.fillText('CHANGE CHARACTER', selectButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
}

// Handle game over input
function handleGameOverInput(e) {
    if (config.gameState !== 'gameOver') return;

    if (e.key === 'Enter' || e.key === ' ') {
        // Play again with same character
        restartGame();
    } else if (e.key === 'Escape') {
        // Go to character selection
        config.gameState = 'characterSelect';
        characterSelectionLoop();
    }
}

// Handle game over clicks
function handleGameOverClick(e) {
    if (config.gameState !== 'gameOver') return;

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

    const boxWidth = 600;
    const boxHeight = 500;
    const boxX = (config.width - boxWidth) / 2;
    const boxY = (config.height - boxHeight) / 2;

    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 30;
    const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
    const buttonY = boxY + boxHeight - 100;

    // Play Again button
    if (adjustedX >= startX && adjustedX <= startX + buttonWidth &&
        adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
        restartGame();
    }

    // Character Select button
    const selectButtonX = startX + buttonWidth + buttonSpacing;
    if (adjustedX >= selectButtonX && adjustedX <= selectButtonX + buttonWidth &&
        adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
        config.gameState = 'characterSelect';
        characterSelectionLoop();
    }
}

// Restart game function
function restartGame() {
    window.location.reload();
}

// Game over loop
function gameOverLoop() {
    if (config.gameState === 'gameOver') {
        drawGameOverScreen();
        requestAnimationFrame(gameOverLoop);
    } else if (config.gameState === 'characterSelect') {
        document.removeEventListener('keydown', handleGameOverInput);
        document.removeEventListener('click', handleGameOverClick);
    } else if (config.gameState === 'playing') {
        document.removeEventListener('keydown', handleGameOverInput);
        document.removeEventListener('click', handleGameOverClick);
    }
}

// Character Selection Screen
const characterSelection = {
    selectedIndex: 0,
    gridColumns: 6,
    cardWidth: 200,
    cardHeight: 200,
    padding: 20
};

function drawCharacterSelection() {
    // Background
    config.ctx.fillStyle = '#1a1a2e';
    config.ctx.fillRect(0, 0, config.width, config.height);

    // Title
    config.ctx.fillStyle = '#fff';
    config.ctx.font = 'bold 48px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText('SELECT YOUR CHARACTER', config.width / 2, 80);

    // Calculate grid layout
    const totalWidth = characterSelection.gridColumns * (characterSelection.cardWidth + characterSelection.padding);
    const startX = (config.width - totalWidth) / 2 + characterSelection.padding;
    const startY = 150;

    // Draw character cards
    CHARACTERS.forEach((char, index) => {
        const col = index % characterSelection.gridColumns;
        const row = Math.floor(index / characterSelection.gridColumns);
        const x = startX + col * (characterSelection.cardWidth + characterSelection.padding);
        const y = startY + row * (characterSelection.cardHeight + characterSelection.padding);

        // Card background
        const isSelected = index === characterSelection.selectedIndex;
        config.ctx.fillStyle = isSelected ? '#4CAF50' : '#2d2d44';
        config.ctx.fillRect(x, y, characterSelection.cardWidth, characterSelection.cardHeight);

        // Border
        config.ctx.strokeStyle = isSelected ? '#66BB6A' : '#444';
        config.ctx.lineWidth = isSelected ? 4 : 2;
        config.ctx.strokeRect(x, y, characterSelection.cardWidth, characterSelection.cardHeight);

        // Character portrait
        const portrait = assets.characters[char.id].portrait || assets.characters[char.id].idle;
        if (portrait && portrait.complete) {
            const portraitSize = 120;
            const portraitX = x + (characterSelection.cardWidth - portraitSize) / 2;
            const portraitY = y + 20;
            config.ctx.drawImage(portrait, portraitX, portraitY, portraitSize, portraitSize);
        }

        // Character name
        config.ctx.fillStyle = '#fff';
        config.ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(
            char.name,
            x + characterSelection.cardWidth / 2,
            y + characterSelection.cardHeight - 40
        );

        // Selection indicator
        if (isSelected) {
            config.ctx.fillStyle = '#FFD700';
            config.ctx.font = '14px Arial';
            config.ctx.fillText('▶ SELECTED ◀', x + characterSelection.cardWidth / 2, y + characterSelection.cardHeight - 15);
        }
    });

    // Instructions
    config.ctx.fillStyle = '#fff';
    config.ctx.font = '20px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.fillText('Use ARROW KEYS to navigate | Press ENTER to select', config.width / 2, config.height - 50);
}

function handleCharacterSelectionInput(e) {
    if (config.gameState !== 'characterSelect') return;

    switch (e.key) {
        case 'ArrowLeft':
            characterSelection.selectedIndex = Math.max(0, characterSelection.selectedIndex - 1);
            break;
        case 'ArrowRight':
            characterSelection.selectedIndex = Math.min(CHARACTERS.length - 1, characterSelection.selectedIndex + 1);
            break;
        case 'ArrowUp':
            characterSelection.selectedIndex = Math.max(0, characterSelection.selectedIndex - characterSelection.gridColumns);
            break;
        case 'ArrowDown':
            characterSelection.selectedIndex = Math.min(CHARACTERS.length - 1, characterSelection.selectedIndex + characterSelection.gridColumns);
            break;
        case 'Enter':
            selectCharacterAndStart();
            break;
    }
}

function selectCharacterAndStart() {
    const selectedChar = CHARACTERS[characterSelection.selectedIndex];
    characterConfig.currentCharacter = selectedChar.id;
    config.gameState = 'playing';
    console.log(`Selected character: ${selectedChar.name}`);
}

function startCharacterSelection() {
    console.log('All assets loaded! Character selection ready...');
    document.addEventListener('keydown', handleCharacterSelectionInput);
    characterSelectionLoop();
}

function characterSelectionLoop() {
    if (config.gameState === 'characterSelect') {
        drawCharacterSelection();
        requestAnimationFrame(characterSelectionLoop);
    } else if (config.gameState === 'playing') {
        document.removeEventListener('keydown', handleCharacterSelectionInput);
        startGame();
    }
}

// Main game loop
let lastFrameTime = 0;
let deltaTime = 0;
const TARGET_FPS = 60;
const FIXED_TIME_STEP = 1000 / TARGET_FPS; // 16.67ms
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let hasAnsweredCorrectly = false; // Flag for correct answer
let targetObstacle = null; // The obstacle to jump over

function gameLoop(currentTime = 0) {
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
    updateObstacles();
    if (!isGamePaused) {
        updateCharacter();
    }
    updateQuiz();

    // Draw everything
    drawBackground();
    drawObstacles();
    drawCharacter();
    drawUI();
    if (isQuizActive) {
        drawQuiz();
    }

    if (config.gameState === 'gameOver') {
        // Switch to game over screen
        document.addEventListener('keydown', handleGameOverInput);
        config.canvas.addEventListener('click', handleGameOverClick);
        gameOverLoop();
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Handle keyboard input during gameplay
function setupControls() {
    // Click handler for quiz
    config.canvas.addEventListener('click', (e) => {
        if (!isQuizActive) return;

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

        const boxWidth = 1200;
        const boxHeight = 600;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        if (currentQuestion.type === 'multiple_choice') {
            // Handle 2x2 grid button clicks
            const buttonWidth = 320;
            const buttonHeight = 80;
            const buttonSpacing = 20;
            const startX = boxX + (boxWidth - 2 * buttonWidth - buttonSpacing) / 2;
            const startY = boxY + 150;

            currentQuestion.options.forEach((option, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const buttonX = startX + col * (buttonWidth + buttonSpacing);
                const buttonY = startY + row * (buttonHeight + buttonSpacing);

                if (adjustedX >= buttonX && adjustedX <= buttonX + buttonWidth &&
                    adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
                    // Check answer
                    if (option === currentQuestion.correct) {
                        // Correct answer - set flag to jump later when close to obstacle
                        hasAnsweredCorrectly = true;
                        currentScore += 10; // Add 10 points for correct answer
                        // Update high score if needed
                        if (currentScore > highScore) {
                            highScore = currentScore;
                            localStorage.setItem('gameHighScore', highScore.toString());
                        }
                    } else {
                        // Wrong answer - game over
                        console.log('Wrong answer! Game Over.');
                        config.gameState = 'gameOver';
                        obstacles = [];
                    }
                    // Reset quiz
                    isQuizActive = false;
                    isGamePaused = false;
                    slowFactor = 1; // Reset speed
                    currentQuestion = null;
                    quizInput = '';
                    lastQuizEnd = Date.now();
                }
            });
        } else if (currentQuestion.type === 'text_input') {
            // Handle text input box clicks
            const inputBoxWidth = 400;
            const inputBoxHeight = 60;
            const inputBoxX = (config.width - inputBoxWidth) / 2;
            const inputBoxY = boxY + 200;

            if (adjustedX >= inputBoxX && adjustedX <= inputBoxX + inputBoxWidth &&
                adjustedY >= inputBoxY && adjustedY <= inputBoxY + inputBoxHeight) {
                // Focus on input box (canvas will capture keyboard events)
                config.canvas.focus();
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (config.gameState !== 'playing') return;

        if (isQuizActive && currentQuestion.type === 'text_input') {
            // Handle quiz input for text_input
            if (e.key === 'Enter') {
                // Check answer
                if (quizInput.trim().toLowerCase() === currentQuestion.correct.toLowerCase()) {
                    // Correct answer - set flag to jump later when close to obstacle
                    hasAnsweredCorrectly = true;
                    currentScore += 10; // Add 10 points for correct answer
                    // Update high score if needed
                    if (currentScore > highScore) {
                        highScore = currentScore;
                        localStorage.setItem('gameHighScore', highScore.toString());
                    }
                } else {
                    // Wrong answer - game over
                    console.log('Wrong answer! Game Over.');
                    config.gameState = 'gameOver';
                    obstacles = [];
                }
                // Reset quiz
                isQuizActive = false;
                isGamePaused = false;
                slowFactor = 1; // Reset speed
                currentQuestion = null;
                quizInput = '';
                lastQuizEnd = Date.now();
            } else if (e.key === 'Backspace') {
                quizInput = quizInput.slice(0, -1);
            } else if (e.key.length === 1) {
                quizInput += e.key;
            }
            e.preventDefault();
        } else if (!isQuizActive) {
            // Game controls
            switch (e.key) {
                case 'Escape':
                    // Return to character selection
                    config.gameState = 'characterSelect';
                    characterSelectionLoop();
                    break;
            }
        }
    });
}

// Start the game
function startGame() {
    console.log('All assets loaded! Starting game...');
    spawnObstacle(); // Spawn first fence immediately
    lastQuizEnd = Date.now();
    setupControls();
    gameLoop();
}

// Initialize the game
async function init() {
    config.canvas = document.getElementById('game');
    config.ctx = config.canvas.getContext('2d');

    resizeCanvas();

    // Draw loading screen
    drawLoadingScreen();

    // Load quiz data first
    await loadQuizData();

    // Load all assets
    loadAssets();
}

// Resize canvas to fit window
function resizeCanvas() {
    config.canvas.width = window.innerWidth;
    config.canvas.height = window.innerHeight;
    config.scale = Math.min(config.canvas.width / config.width, config.canvas.height / config.height);
    config.ctx.scale(config.scale, config.scale);

    // Center the game
    const offsetX = (config.canvas.width / config.scale - config.width) / 2;
    const offsetY = (config.canvas.height / config.scale - config.height) / 2;
    config.ctx.translate(offsetX, offsetY);

    // Update relative positions
    config.groundY = config.height * 0.8;
    characterConfig.y = config.groundY; // Reset to ground if not jumping
}

// Start when page loads
window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);
