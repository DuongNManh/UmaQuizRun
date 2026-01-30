// Game Start Transition module

const GameStartTransition = {
    isActive: false,
    startTime: 0,
    duration: 2500, // 2.5 seconds transition
    character: {
        x: 0,
        y: 0,
        scale: 1,
        targetX: 0,
        targetY: 0,
        targetScale: 7,
        frameIndex: 0,
        frameCounter: 0,
        frameDelay: 12
    },
    swipeTransition: {
        isActive: false,
        startTime: 0,
        duration: 500,
        x: 0
    },
    hasPlayedBoostSfx: false,

    init() {
        this.isActive = true;
        this.startTime = Date.now();
        this.hasPlayedBoostSfx = false;

        // Set initial position (center of screen)
        this.character.x = config.width / 2 - 50;
        this.character.y = config.height / 2 - 300;
        this.character.scale = 1;
        this.character.frameIndex = 0;
        this.character.frameCounter = 0;

        this.character.targetX = config.width / 2 - 50;
        this.character.targetY = config.groundY - 100;
        this.character.targetScale = 7;

        // Reset swipe transition
        this.swipeTransition.isActive = false;

        this.startLoop();
    },

    update() {
        if (!this.isActive) return;

        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Play boost SFX once at the beginning
        if (!this.hasPlayedBoostSfx) {
            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            if (currentChar) {
                const boostSfxPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-boost.ogg`;
                AudioManager.playSoundEffect(boostSfxPath, 0.4);
            }
            this.hasPlayedBoostSfx = true;
        }

        // Easing function (ease out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 1.2);

        // Update character position and scale
        const startX = config.width / 2 - 300;
        const startY = config.height / 2;

        this.character.x = startX + (this.character.targetX - startX) * easeOut;
        this.character.y = startY + (this.character.targetY - startY) * easeOut;
        this.character.scale = 1 + (this.character.targetScale - 1) * easeOut;

        // Update boost animation frames
        this.character.frameCounter++;
        if (this.character.frameCounter >= this.character.frameDelay) {
            this.character.frameCounter = 0;

            const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
            const boostSprite = assets.characters[currentChar.id].boost;

            if (boostSprite && boostSprite.complete) {
                const frameHeight = boostSprite.height;
                const frameWidth = frameHeight;
                const frameCount = Math.floor(boostSprite.width / frameWidth);
                this.character.frameIndex = (this.character.frameIndex + 1) % frameCount;
            }
        }

        // Start swipe transition near the end - let character finish movement first
        if (progress >= 0.8 && !this.swipeTransition.isActive) {
            this.swipeTransition.isActive = true;
            this.swipeTransition.startTime = currentTime;
            this.swipeTransition.x = -config.width;
        }

        // Update swipe transition
        if (this.swipeTransition.isActive) {
            const swipeElapsed = currentTime - this.swipeTransition.startTime;
            const swipeProgress = Math.min(swipeElapsed / this.swipeTransition.duration, 1);
            const swipeEase = 1 - Math.pow(1 - swipeProgress, 2); // Ease out quad

            this.swipeTransition.x = -config.width + (config.width * swipeEase);
        }

        // End transition
        if (progress >= 1 && this.swipeTransition.isActive &&
            currentTime - this.swipeTransition.startTime >= this.swipeTransition.duration) {
            this.isActive = false;
            config.gameState = 'playing';
            Game.start();
        }
    },

    draw() {
        // Draw appropriate boost background based on game mode
        const bgKey = currentGameMode === GAME_MODES.RANDOM_10 ? 'bgBoost1' : 'bgBoost2';
        const boostBg = assets.backgrounds[bgKey];

        if (boostBg && boostBg.complete) {
            config.ctx.drawImage(boostBg, 0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, config.width, config.height);
            gradient.addColorStop(0, currentGameMode === GAME_MODES.RANDOM_10 ? '#FF6B35' : '#4ECDC4');
            gradient.addColorStop(1, currentGameMode === GAME_MODES.RANDOM_10 ? '#F7931E' : '#44A08D');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Draw boosting character
        const currentChar = CHARACTERS.find(c => c.id === characterConfig.currentCharacter);
        const boostSprite = assets.characters[currentChar.id].boost;

        if (boostSprite && boostSprite.complete) {
            const frameHeight = boostSprite.height;
            const frameWidth = frameHeight;
            const spriteSize = frameWidth * this.character.scale;

            config.ctx.drawImage(
                boostSprite,
                this.character.frameIndex * frameWidth, 0, frameWidth, frameHeight,
                this.character.x - spriteSize / 2,
                this.character.y - spriteSize / 2,
                spriteSize, spriteSize
            );
        }

        // Draw swipe transition overlay
        if (this.swipeTransition.isActive) {
            config.ctx.fillStyle = '#000';
            config.ctx.fillRect(this.swipeTransition.x, 0, config.width, config.height);
        }

        config.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        config.ctx.font = 'bold 46px Arial';
        config.ctx.fillText('Cùng vượt qua thử thách nào!', config.width / 2, 160);
    },

    startLoop() {
        this.loop();
    },

    loop() {
        if (config.gameState === 'gameStart' && this.isActive) {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        }
    }
};