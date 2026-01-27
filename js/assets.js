// Assets management module

// Assets to load
const assets = {
    backgrounds: {
        bg1: null,
        bg2: null,
        fence: null,
        bgBoost1: null,
        bgBoost2: null,
        bgMenu: null
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
        portrait: null,
        mainSprite: null
    };
});

// Utility function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Load quiz data from JSON
async function loadQuizData() {
    try {
        const response = await fetch('js/quizData.json');
        if (!response.ok) {
            throw new Error('Failed to load quiz data');
        }
        const data = await response.json();
        
        // Check if data has new structure with shuffle flag
        if (data.questions && Array.isArray(data.questions)) {
            // New structure with shuffle flag
            quizData = data.shuffle ? shuffleArray(data.questions) : data.questions;
            console.log('Quiz data loaded:', quizData.length, 'questions', data.shuffle ? '(shuffled)' : '');
        } else if (Array.isArray(data)) {
            // Old structure (backward compatibility)
            quizData = data;
            console.log('Quiz data loaded (legacy format):', quizData.length, 'questions');
        } else {
            throw new Error('Invalid quiz data format');
        }
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
        { key: 'bgBoost1', path: 'assets/background/bg-boost-1.png', category: 'backgrounds' },
        { key: 'bgBoost2', path: 'assets/background/bg-boost-2.png', category: 'backgrounds' },
        { key: 'bgMenu', path: 'assets/background/bg-menu.png', category: 'backgrounds' },

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

        // Add main sprite (no suffix) if exists
        imagesToLoad.push({
            key: 'mainSprite',
            path: `assets/characters/${char.folder}/${char.prefix}.png`,
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
                config.gameState = 'menu';
                Menu.start();
            }
        };
        img.onerror = () => {
            console.error(`Failed to load: ${imageInfo.path}`);
            assets.loaded++;
            if (assets.loaded === assets.total) {
                config.gameState = 'menu';
                Menu.start();
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
    config.ctx.fillText('Đang tải...', config.width / 2, config.height / 2 - 20);

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