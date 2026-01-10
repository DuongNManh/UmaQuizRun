// Game Configuration
const config = {
    canvas: null,
    ctx: null,
    width: 1600,
    height: 900,
    groundY: 700,
    gameState: 'loading' // loading, characterSelect, playing
};

// Available characters with their metadata
const CHARACTERS = [
    { id: 'cb', name: 'MR.C.B', folder: 'CB', prefix: 'cb' },
    { id: 'daiwa', name: 'Daiwa Scarlet', folder: 'Daiwa', prefix: 'daiwa' },
    { id: 'dia', name: 'Dia', folder: 'Dia', prefix: 'dia' },
    { id: 'goldship', name: 'Gold Ship', folder: 'GoldShip', prefix: 'gs' },
    { id: 'grass', name: 'Grass Wonder', folder: 'Grass', prefix: 'gw' },
    { id: 'kitasan', name: 'Kitasan Black', folder: 'Kitasan', prefix: 'kita' },
    { id: 'mcqueen', name: 'Mejiro McQueen', folder: 'McQueen', prefix: 'mq' },
    { id: 'oguri', name: 'Oguri Cap', folder: 'Oguri', prefix: 'oguri' },
    { id: 'rudolf', name: 'Symboli Rudolf', folder: 'Rudolf', prefix: 'rudolf' },
    { id: 'spe', name: 'Special Week', folder: 'Spe', prefix: 'spe' },
    { id: 'still', name: 'Still In Love', folder: 'Still', prefix: 'still' },
    { id: 'sunday', name: 'Marvelous Sunday', folder: 'Sunday', prefix: 'sunday' },
    { id: 'suzuka', name: 'Silence Suzuka', folder: 'Suzuka', prefix: 'suzuka' },
    { id: 'tachyon', name: 'Agnes Tachyon', folder: 'Tachyon', prefix: 'tachyon' },
    { id: 'teio', name: 'Tokai Teio', folder: 'Teio', prefix: 'teio' },
    { id: 'vodka', name: 'Vodka', folder: 'Vodka', prefix: 'vodka' },
];

// Animation types
const ANIMATION_TYPES = ['run', 'boost', 'idle', 'win'];

// Assets to load
const assets = {
    backgrounds: {
        bg1: null,
        bg2: null,
        fence: null
    },
    characters: {},
    effects: {
        smoke: []
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
    x: 150,
    y: 750,
    scale: 2,
    currentAnimation: 'run',
    frameIndex: 0,
    frameCount: 0,
    frameDelay: 10,
    frameCounter: 0
};

// Background scrolling
const background = {
    x1: 0,
    x2: 0,
    speed: 5
};

// Load all assets dynamically
function loadAssets() {
    const imagesToLoad = [
        // Backgrounds
        { key: 'bg1', path: 'assets/background/bg-1.png', category: 'backgrounds' },
        { key: 'bg2', path: 'assets/background/bg-2.png', category: 'backgrounds' },
        { key: 'fence', path: 'assets/background/fence_00.png', category: 'backgrounds' },

        // Run smoke effects
        { key: 0, path: 'assets/characters/run/runsmoke1_1.png', category: 'effects', effect: 'smoke' },
        { key: 1, path: 'assets/characters/run/runsmoke1_2.png', category: 'effects', effect: 'smoke' },
        { key: 2, path: 'assets/characters/run/runsmoke1_3.png', category: 'effects', effect: 'smoke' },
        { key: 3, path: 'assets/characters/run/runsmoke1_4.png', category: 'effects', effect: 'smoke' },
        { key: 4, path: 'assets/characters/run/runsmoke1_5.png', category: 'effects', effect: 'smoke' },
        { key: 5, path: 'assets/characters/run/runsmoke1_6.png', category: 'effects', effect: 'smoke' }
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
                // Calculate background x2 position after images are loaded
                background.x2 = assets.backgrounds.bg1.width;
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
                assets.effects.smoke[imageInfo.key] = img;
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
        // Draw two copies of background for seamless scrolling
        config.ctx.drawImage(assets.backgrounds.bg1, background.x1, 0, config.width, config.height);

        // Flip the second background horizontally
        config.ctx.save();
        config.ctx.scale(-1, 1);
        config.ctx.drawImage(assets.backgrounds.bg1, -background.x2 - config.width, 0, config.width, config.height);
        config.ctx.restore();

        // Update positions
        background.x1 -= background.speed;
        background.x2 -= background.speed;

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

        // Update frame animation
        characterConfig.frameCounter++;
        if (characterConfig.frameCounter >= characterConfig.frameDelay) {
            characterConfig.frameCounter = 0;
            characterConfig.frameIndex = (characterConfig.frameIndex + 1) % frameCount;
        }

        // Draw current frame
        config.ctx.drawImage(
            sprite,
            characterConfig.frameIndex * frameWidth, 0, frameWidth, frameHeight,
            characterConfig.x, characterConfig.y,
            frameWidth * characterConfig.scale, frameHeight * characterConfig.scale
        );
    }
}

// Draw UI overlay
function drawUI() {
    if (config.gameState !== 'playing') return;

    // Character selector
    config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    config.ctx.fillRect(10, 10, 200, 120);

    config.ctx.fillStyle = '#fff';
    config.ctx.font = '16px Arial';
    config.ctx.textAlign = 'left';
    config.ctx.fillText('Controls:', 20, 30);
    config.ctx.font = '14px Arial';
    config.ctx.fillText('R - Run Animation', 20, 55);
    config.ctx.fillText('B - Boost Animation', 20, 75);
    config.ctx.fillText('I - Idle Animation', 20, 95);
    config.ctx.fillText('W - Win Animation', 20, 115);

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

// Character Selection Screen
const characterSelection = {
    selectedIndex: 0,
    gridColumns: 5,
    cardWidth: 200,
    cardHeight: 280,
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
function gameLoop() {
    // Clear canvas
    config.ctx.clearRect(0, 0, config.width, config.height);

    // Draw everything
    drawBackground();
    drawCharacter();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// Handle keyboard input during gameplay
function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (config.gameState !== 'playing') return;

        switch (e.key) {
            case 'r':
            case 'R':
                characterConfig.currentAnimation = 'run';
                characterConfig.frameIndex = 0;
                break;
            case 'b':
            case 'B':
                characterConfig.currentAnimation = 'boost';
                characterConfig.frameIndex = 0;
                break;
            case 'i':
            case 'I':
                characterConfig.currentAnimation = 'idle';
                characterConfig.frameIndex = 0;
                break;
            case 'w':
            case 'W':
                characterConfig.currentAnimation = 'win';
                characterConfig.frameIndex = 0;
                break;
            case 'Escape':
                // Return to character selection
                config.gameState = 'characterSelect';
                characterSelectionLoop();
                break;
        }
    });
}

// Start the game
function startGame() {
    console.log('All assets loaded! Starting game...');
    setupControls();
    gameLoop();
}

// Initialize the game
function init() {
    config.canvas = document.getElementById('game');
    config.ctx = config.canvas.getContext('2d');

    // Draw loading screen
    drawLoadingScreen();

    // Load all assets
    loadAssets();
}

// Start when page loads
window.addEventListener('load', init);
