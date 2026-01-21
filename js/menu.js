// Menu and Character Selection module

// Menu Screen
const Menu = {
    selectedIndex: 0,
    options: [
        { text: 'RANDOM 10 QUESTIONS', mode: GAME_MODES.RANDOM_10 },
        { text: 'ENDLESS MODE', mode: GAME_MODES.ENDLESS }
    ],
    backgroundImage: null,
    runningCharacters: [],
    lastSpawnTime: 0,
    spawnInterval: 6000, // 6 seconds
    frameDelay: 150,

    update() {
        const currentTime = Date.now();

        // Spawn new characters
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnCharacters();
            this.lastSpawnTime = currentTime;
        }

        // Update running characters
        this.runningCharacters.forEach((runner, index) => {
            runner.x += runner.speed;

            // Update animation frame
            if (currentTime - runner.lastFrameTime > this.frameDelay) {
                const sprite = assets.characters[runner.char.id].mainSprite || assets.characters[runner.char.id].idle;
                if (sprite && sprite.complete) {
                    const spriteHeight = sprite.height;
                    const frameWidth = spriteHeight;
                    const frameCount = Math.floor(sprite.width / frameWidth);
                    if (frameCount > 1) {
                        runner.frameIndex = (runner.frameIndex + 1) % frameCount;
                    }
                }
                runner.lastFrameTime = currentTime;
            }

            // Remove if off screen
            if (runner.x > config.width + 200) {
                this.runningCharacters.splice(index, 1);
            }
        });
    },

    spawnCharacters() {
        if (this.runningCharacters.length >= 10) return;
        const numToSpawn = 2 + Math.floor(Math.random() * 3); // 2 to 4
        const availableChars = [...CHARACTERS];

        for (let i = 0; i < numToSpawn && availableChars.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableChars.length);
            const char = availableChars.splice(randomIndex, 1)[0];

            this.runningCharacters.push({
                char: char,
                x: -200,
                yOffset: -200 + Math.random() * 100, // Random vertical offset from 50 to 150
                speed: 5 + Math.random() * 5, // 5-10
                frameIndex: 0,
                lastFrameTime: Date.now()
            });
        }
    },

    draw() {
        // Background image
        if (this.backgroundImage && this.backgroundImage.complete) {
            config.ctx.drawImage(this.backgroundImage, 0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Draw running characters
        this.runningCharacters.forEach(runner => {
            const sprite = assets.characters[runner.char.id].mainSprite || assets.characters[runner.char.id].idle;
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                const spriteHeight = sprite.height;
                const frameWidth = spriteHeight;
                const charSize = 250;
                const charY = config.height - charSize + runner.yOffset;

                config.ctx.drawImage(
                    sprite,
                    runner.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    runner.x - charSize / 2, charY, charSize, charSize
                );
            }
        });

        // Title
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 72px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('HCM RUNNER', config.width / 2, 200);

        // Subtitle
        config.ctx.fillStyle = '#aaa';
        config.ctx.font = '24px Arial';
        config.ctx.fillText('Choose Your Game Mode', config.width / 2, 250);

        // Menu options
        this.options.forEach((option, index) => {
            const isSelected = index === this.selectedIndex;
            const y = 400 + index * 120;

            // Button background
            const buttonWidth = 500;
            const buttonHeight = 80;
            const buttonX = (config.width - buttonWidth) / 2;
            const buttonY = y - 40;

            config.ctx.fillStyle = isSelected ? '#4CAF50' : '#2d2d44';
            config.ctx.beginPath();
            config.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
            config.ctx.fill();

            // Button border
            config.ctx.strokeStyle = isSelected ? '#66BB6A' : '#444';
            config.ctx.lineWidth = isSelected ? 4 : 2;
            config.ctx.stroke();

            // Button text
            config.ctx.fillStyle = '#fff';
            config.ctx.font = isSelected ? 'bold 24px Arial' : '22px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(option.text, config.width / 2, y);

            // Selection indicator
            if (isSelected) {
                config.ctx.fillStyle = '#FFD700';
                config.ctx.font = '18px Arial';
                config.ctx.fillText('▶ PRESS ENTER TO SELECT ◀', config.width / 2, y + 35);
            }
        });

        // Instructions
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '20px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('Use ARROW KEYS to navigate | Press ENTER to continue', config.width / 2, config.height - 50);
    },

    handleInput(e) {
        if (config.gameState !== 'menu') return;

        switch (e.key) {
            case 'ArrowUp':
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                break;
            case 'ArrowDown':
                this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
                break;
            case 'Enter':
                currentGameMode = this.options[this.selectedIndex].mode;
                config.gameState = 'characterSelect';
                CharacterSelection.start();
                break;
        }
    },

    start() {
        console.log('Starting menu...');
        this.backgroundImage = assets.backgrounds.bgMenu;
        this.lastSpawnTime = Date.now();
        
        // Reset canvas transform and apply proper scaling
        config.ctx.setTransform(1, 0, 0, 1, 0, 0);
        resizeCanvas();
        
        document.addEventListener('keydown', this.handleInput.bind(this));
        this.loop();
    },

    loop() {
        if (config.gameState === 'menu') {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else if (config.gameState === 'characterSelect') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
        }
    }
};

// Character Selection Screen
const CharacterSelection = {
    selectedIndex: 0,
    currentCharacterIndex: 0,
    hasPlayedInitialSfx: false,
    backgroundImage: null,
    // Animation config cho character preview
    frameIndex: 0,
    frameCounter: 0,
    frameDelay: 150, // Slower animation for character selection
    lastAnimationTime: 0,
    // SFX debounce system
    sfxTimer: null,
    sfxDelay: 500, // 500ms delay trước khi phát SFX

    draw() {
        // Background image
        if (this.backgroundImage && this.backgroundImage.complete) {
            config.ctx.drawImage(this.backgroundImage, 0, 0, config.width, config.height);
        } else {
            // Fallback gradient
            const gradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            config.ctx.fillStyle = gradient;
            config.ctx.fillRect(0, 0, config.width, config.height);
        }

        // Title
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('SELECT YOUR CHARACTER', config.width / 2, 120);

        // Game mode indicator
        config.ctx.fillStyle = '#4CAF50';
        config.ctx.font = 'bold 24px Arial';
        const modeText = currentGameMode === GAME_MODES.RANDOM_10 ? 'RANDOM 10 QUESTIONS MODE' : 'ENDLESS MODE';
        config.ctx.fillText(modeText, config.width / 2, 160);

        // Main character display area
        const centerX = config.width / 2;
        const centerY = config.height / 2;

        // Character platform/podium
        const platformWidth = 300;
        const platformHeight = 80;
        const platformX = centerX - platformWidth / 2;
        const platformY = centerY + 100;

        // Platform gradient
        const platformGradient = config.ctx.createLinearGradient(0, platformY, 0, platformY + platformHeight);
        platformGradient.addColorStop(0, '#8B4513');
        platformGradient.addColorStop(1, '#654321');
        config.ctx.fillStyle = platformGradient;
        config.ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

        // Platform border
        config.ctx.strokeStyle = '#444';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(platformX, platformY, platformWidth, platformHeight);

        // Current character display - ANIMATED
        const currentChar = CHARACTERS[this.currentCharacterIndex];
        const idleSprite = assets.characters[currentChar.id].idle;

        if (idleSprite && idleSprite.complete) {
            const spriteHeight = idleSprite.height;
            const frameWidth = spriteHeight; // Assuming square frames
            const frameCount = Math.floor(idleSprite.width / frameWidth);

            // Calculate display size and position
            const charSize = 200;
            const charX = centerX - charSize / 2;
            const charY = platformY - charSize + 20;

            // Draw current animated frame
            if (frameCount > 1) {
                // Multi-frame sprite sheet - draw current frame
                config.ctx.drawImage(
                    idleSprite,
                    this.frameIndex * frameWidth, 0, frameWidth, spriteHeight,
                    charX, charY, charSize, charSize
                );
            } else {
                // Single frame - draw normally
                config.ctx.drawImage(idleSprite, charX, charY, charSize, charSize);
            }
        }

        // Character name
        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 32px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(currentChar.name, centerX, centerY - 150);

        // Left arrow button
        const arrowSize = 80;
        const leftArrowX = centerX - 250;
        const leftArrowY = centerY - arrowSize / 2;

        config.ctx.fillStyle = this.currentCharacterIndex > 0 ? '#FFD700' : '#666';
        config.ctx.fillRect(leftArrowX, leftArrowY, arrowSize, arrowSize);
        config.ctx.strokeStyle = '#333';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(leftArrowX, leftArrowY, arrowSize, arrowSize);

        config.ctx.fillStyle = '#000';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.fillText('◀', leftArrowX + arrowSize / 2, leftArrowY + arrowSize / 2 + 15);

        // Right arrow button
        const rightArrowX = centerX + 170;
        const rightArrowY = centerY - arrowSize / 2;

        config.ctx.fillStyle = this.currentCharacterIndex < CHARACTERS.length - 1 ? '#FFD700' : '#666';
        config.ctx.fillRect(rightArrowX, rightArrowY, arrowSize, arrowSize);
        config.ctx.strokeStyle = '#333';
        config.ctx.lineWidth = 3;
        config.ctx.strokeRect(rightArrowX, rightArrowY, arrowSize, arrowSize);

        config.ctx.fillStyle = '#000';
        config.ctx.font = 'bold 48px Arial';
        config.ctx.fillText('▶', rightArrowX + arrowSize / 2, rightArrowY + arrowSize / 2 + 15);

        // Character counter
        config.ctx.fillStyle = '#aaa';
        config.ctx.font = '20px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText(`${this.currentCharacterIndex + 1} / ${CHARACTERS.length}`, centerX, centerY + 200);

        // START button
        const startButtonWidth = 200;
        const startButtonHeight = 60;
        const startButtonX = centerX - startButtonWidth / 2;
        const startButtonY = centerY + 250;

        config.ctx.fillStyle = '#4CAF50';
        config.ctx.beginPath();
        config.ctx.roundRect(startButtonX, startButtonY, startButtonWidth, startButtonHeight, 15);
        config.ctx.fill();

        config.ctx.strokeStyle = '#66BB6A';
        config.ctx.lineWidth = 3;
        config.ctx.stroke();

        config.ctx.fillStyle = '#fff';
        config.ctx.font = 'bold 24px Arial';
        config.ctx.fillText('START GAME', centerX, startButtonY + startButtonHeight / 2 + 8);

        // Instructions
        config.ctx.fillStyle = '#fff';
        config.ctx.font = '18px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('Use LEFT/RIGHT arrows to choose character | Press ENTER to start | ESC to go back', config.width / 2, config.height - 30);
    },

    update() {
        // Play idle SFX once when character selection screen first loads
        if (!this.hasPlayedInitialSfx) {
            this.playCharacterIdleSfxImmediate(); // Phát ngay lập tức cho lần đầu
            this.hasPlayedInitialSfx = true;
        }

        // Update character animation
        const currentTime = Date.now();
        if (currentTime - this.lastAnimationTime > this.frameDelay) {
            const currentChar = CHARACTERS[this.currentCharacterIndex];
            const idleSprite = assets.characters[currentChar.id].idle;

            if (idleSprite && idleSprite.complete) {
                const spriteHeight = idleSprite.height;
                const frameWidth = spriteHeight;
                const frameCount = Math.floor(idleSprite.width / frameWidth);

                if (frameCount > 1) {
                    this.frameIndex = (this.frameIndex + 1) % frameCount;
                }
            }

            this.lastAnimationTime = currentTime;
        }
    },

    playCharacterIdleSfx() {
        // Clear existing timer nếu có
        if (this.sfxTimer) {
            clearTimeout(this.sfxTimer);
            this.sfxTimer = null;
        }

        // Set timer mới để phát SFX sau delay
        this.sfxTimer = setTimeout(() => {
            const currentChar = CHARACTERS[this.currentCharacterIndex];
            if (currentChar) {
                const idleSfxPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-idle.ogg`;
                AudioManager.playSoundEffect(idleSfxPath, 0.5);
            }
            this.sfxTimer = null;
        }, this.sfxDelay);
    },

    // Phát SFX ngay lập tức cho initial load
    playCharacterIdleSfxImmediate() {
        const currentChar = CHARACTERS[this.currentCharacterIndex];
        if (currentChar) {
            const idleSfxPath = `assets/characters/${currentChar.folder}/${currentChar.prefix}-idle.ogg`;
            AudioManager.playSoundEffect(idleSfxPath, 0.5);
        }
    },

    selectCharacterAndStart() {
        const selectedChar = CHARACTERS[this.currentCharacterIndex];
        characterConfig.currentCharacter = selectedChar.id;

        // Start game transition instead of going directly to playing
        config.gameState = 'gameStart';
        GameStartTransition.init();

        console.log(`Selected character: ${selectedChar.name} for ${currentGameMode} mode`);
    },

    handleInput(e) {
        if (config.gameState !== 'characterSelect') return;

        switch (e.key) {
            case 'ArrowLeft':
                if (this.currentCharacterIndex > 0) {
                    this.currentCharacterIndex--;
                    this.frameIndex = 0; // Reset animation
                    this.playCharacterIdleSfx();
                }
                break;
            case 'ArrowRight':
                if (this.currentCharacterIndex < CHARACTERS.length - 1) {
                    this.currentCharacterIndex++;
                    this.frameIndex = 0; // Reset animation
                    this.playCharacterIdleSfx();
                }
                break;
            case 'Enter':
                this.selectCharacterAndStart();
                break;
            case 'Escape':
                config.gameState = 'menu';
                this.hasPlayedInitialSfx = false; // Reset flag khi quay về menu
                // Clear any existing SFX timer
                if (this.sfxTimer) {
                    clearTimeout(this.sfxTimer);
                    this.sfxTimer = null;
                }
                Menu.loop();
                break;
        }
    },

    handleClick(e) {
        if (config.gameState !== 'characterSelect') return;

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

        const centerX = config.width / 2;
        const centerY = config.height / 2;
        const arrowSize = 80;

        // Left arrow button
        const leftArrowX = centerX - 250;
        const leftArrowY = centerY - arrowSize / 2;

        if (adjustedX >= leftArrowX && adjustedX <= leftArrowX + arrowSize &&
            adjustedY >= leftArrowY && adjustedY <= leftArrowY + arrowSize) {
            if (this.currentCharacterIndex > 0) {
                this.currentCharacterIndex--;
                this.frameIndex = 0; // Reset animation
                this.playCharacterIdleSfx();
            }
            return;
        }

        // Right arrow button
        const rightArrowX = centerX + 170;
        const rightArrowY = centerY - arrowSize / 2;

        if (adjustedX >= rightArrowX && adjustedX <= rightArrowX + arrowSize &&
            adjustedY >= rightArrowY && adjustedY <= rightArrowY + arrowSize) {
            if (this.currentCharacterIndex < CHARACTERS.length - 1) {
                this.currentCharacterIndex++;
                this.frameIndex = 0; // Reset animation
                this.playCharacterIdleSfx();
            }
            return;
        }

        // START button
        const startButtonWidth = 200;
        const startButtonHeight = 60;
        const startButtonX = centerX - startButtonWidth / 2;
        const startButtonY = centerY + 250;

        if (adjustedX >= startButtonX && adjustedX <= startButtonX + startButtonWidth &&
            adjustedY >= startButtonY && adjustedY <= startButtonY + startButtonHeight) {
            this.selectCharacterAndStart();
        }
    },

    start() {
        console.log('All assets loaded! Character selection ready...');
        this.backgroundImage = assets.backgrounds.bgMenu;
        
        // Reset canvas transform and apply proper scaling
        config.ctx.setTransform(1, 0, 0, 1, 0, 0);
        resizeCanvas();
        
        document.addEventListener('keydown', this.handleInput.bind(this));
        config.canvas.addEventListener('click', this.handleClick.bind(this));
        this.hasPlayedInitialSfx = false; // Reset flag khi vào character selection
        this.frameIndex = 0; // Reset animation
        this.lastAnimationTime = Date.now();
        // Clear any existing SFX timer
        if (this.sfxTimer) {
            clearTimeout(this.sfxTimer);
            this.sfxTimer = null;
        }
        this.loop();
    },

    loop() {
        if (config.gameState === 'characterSelect') {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else if (config.gameState === 'gameStart') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
            // gameStart will handle its own loop
        } else if (config.gameState === 'playing') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
            Game.start();
        } else if (config.gameState === 'menu') {
            document.removeEventListener('keydown', this.handleInput.bind(this));
            config.canvas.removeEventListener('click', this.handleClick.bind(this));
        }
    }
};