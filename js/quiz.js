// Quiz and Game Over modules

const Quiz = {
    // State for answer feedback effects
    answerEffect: null,

    // Helper to wrap long text into multiple lines within a max width
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach((word) => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const { width } = ctx.measureText(testLine);
            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    },

    // Trigger visual feedback for answers
    triggerAnswerEffect(type) {
        const duration = type === 'correct' ? 800 : 500; // ms
        const effect = {
            type,
            startTime: Date.now(),
            duration
        };

        if (type === 'correct') {
            const centerX = config.width / 2;
            const centerY = config.height / 2;
            const colors = ['#ffdd57', '#ff4b4b', '#58cc02', '#1cb0f6'];
            const particles = [];

            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 3;
                particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 400 + Math.random() * 400,
                    color: colors[i % colors.length]
                });
            }

            effect.particles = particles;
        }

        this.answerEffect = effect;
    },
    // Draw quiz UI
    draw() {
        if (!currentQuestion) return;

        // Semi-transparent overlay with Duolingo green
        // config.ctx.fillStyle = 'rgba(0, 8, 2, 0.81)';
        // config.ctx.fillRect(0, 0, config.width, config.height);

        // Quiz box - Duolingo style (rounded rectangle)
        const boxWidth = 1200;
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

        // Question text with Duolingo styling (supports wrapping for long text)
        config.ctx.fillStyle = '#2d3748';
        config.ctx.font = 'bold 28px Arial';
        config.ctx.textAlign = 'center';

        const questionMaxWidth = boxWidth - 160; // padding inside box
        const questionStartY = boxY + 80;
        const questionLineHeight = 34;

        const questionLines = Quiz.wrapText(config.ctx, currentQuestion.question, questionMaxWidth);
        questionLines.forEach((line, index) => {
            config.ctx.fillText(line, config.width / 2, questionStartY + index * questionLineHeight);
        });

        if (currentQuestion.type === 'MC') {
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

                // Button text (wrap long answers inside button)
                config.ctx.fillStyle = '#fff';
                config.ctx.font = 'bold 18px Arial';
            
                config.ctx.textAlign = 'center';

                const optionMaxWidth = buttonWidth - 40; // padding inside button
                const lineHeight = 22;
                const lines = Quiz.wrapText(config.ctx, option, optionMaxWidth);
                const totalTextHeight = lines.length * lineHeight;
                let textY = buttonY + (buttonHeight - totalTextHeight) / 2 + lineHeight - 4;

                lines.forEach(line => {
                    config.ctx.fillText(line, buttonX + buttonWidth / 2, textY);
                    textY += lineHeight;
                });
            });
        } else if (currentQuestion.type === 'TI') {
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
            const displayText = quizInput || '...';
            config.ctx.fillStyle = quizInput ? '#2d3748' : '#9ca3af';
            config.ctx.fillText(displayText, inputBoxX + inputBoxWidth / 2, inputBoxY + inputBoxHeight / 2 + 8);

            // Badge hint: type Vietnamese without accents (không dấu)
            const badgePaddingX = 16;
            const badgePaddingY = 6;
            const badgeText = 'Gõ KHÔNG DẤU, ví dụ: doc lap';

            config.ctx.font = 'bold 14px Arial';
            const badgeTextWidth = config.ctx.measureText(badgeText).width;
            const badgeWidth = badgeTextWidth + badgePaddingX * 2;
            const badgeHeight = 28;
            const badgeX = (config.width - badgeWidth) / 2;
            const badgeY = inputBoxY - badgeHeight - 12;

            // Badge background
            config.ctx.fillStyle = '#e2e8f0';
            config.ctx.beginPath();
            config.ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 14);
            config.ctx.fill();

            // Badge border
            config.ctx.strokeStyle = '#a0aec0';
            config.ctx.lineWidth = 1;
            config.ctx.stroke();

            // Badge text
            config.ctx.fillStyle = '#2d3748';
            config.ctx.textAlign = 'center';
            config.ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 4);
        }

        // Timer with Duolingo styling
        const timeLeft = Math.ceil(quizTimer / 1000);
        const timerColor = timeLeft <= 5 ? '#ff4b4b' : '#58cc02';
        config.ctx.fillStyle = timerColor;
        config.ctx.font = 'bold 36px Arial';
        config.ctx.fillText(`⏱️ ${timeLeft}s`, config.width / 2, boxY + boxHeight - 100);
    },

    // Normalize Vietnamese text for comparison
    // - trim & lowercase
    // - normalize Unicode
    // - remove accents (so "doc lap" matches "độc lập")
    // - collapse multiple spaces
    normalizeVietnameseText(text) {
    if (!text) return '';

    let result = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
        .replace(/đ/g, 'd')             // map đ
        .replace(/[^a-z0-9\s]/g, ' ')   // bỏ ký tự đặc biệt
        .replace(/\s+/g, ' ')           // gộp space
        .trim();

    return result;
    },

    // Handle keyboard input for quiz
    handleKeyboard(e) {
        if (!isQuizActive || !currentQuestion) return;

        if (currentQuestion.type === 'TI') {
            // Handle text input quiz with Vietnamese UTF-8 support
            if (e.key === 'Enter') {
                this.checkTextAnswer();
            } else if (e.key === 'Backspace') {
                // Handle backspace - properly remove last character including UTF-8 composed chars

    
                const chars = Array.from(quizInput);
                quizInput = chars.slice(0, -1).join('');
            } else if (e.key.length === 1 || e.key === 'Dead') {
                // Allow single character input including Vietnamese characters
                // Dead keys are used for composing Vietnamese diacritics
                if (e.key !== 'Dead') {
                    quizInput += e.key;
                }
            }
            e.preventDefault();
        }
        // Multiple choice is handled via mouse clicks only
    },

    // Draw active answer effects (called from main UI loop)
    drawEffects() {
        if (!this.answerEffect) return;

        const now = Date.now();
        const { type, startTime, duration } = this.answerEffect;
        const elapsed = now - startTime;

        if (elapsed > duration) {
            this.answerEffect = null;
            return;
        }

        if (type === 'correct') {
            this.drawFireworkEffect(elapsed, duration);
        } else if (type === 'wrong') {
            this.drawWrongEffect(elapsed, duration);
        }
    },

    drawFireworkEffect(elapsed, duration) {
        const effect = this.answerEffect;
        if (!effect || !effect.particles) return;

        const ctx = config.ctx;
        const fade = Math.max(0, 1 - elapsed / duration);

        effect.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.life -= 16;
        });

        effect.particles = effect.particles.filter(p => p.life > 0);

        ctx.save();
        ctx.globalAlpha = fade;
        effect.particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    },

    drawWrongEffect(elapsed, duration) {
        const ctx = config.ctx;
        const progress = elapsed / duration;
        const intensity = 10 * (1 - progress);
        const offsetX = Math.sin(elapsed / 60 * Math.PI * 4) * intensity;

        const boxWidth = 800;
        const boxHeight = 250;
        const boxX = (config.width - boxWidth) / 2;
        const boxY = (config.height - boxHeight) / 2;

        ctx.save();
        ctx.translate(offsetX, 0);
        ctx.strokeStyle = 'rgba(255, 75, 75, 0.9)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 24);
        ctx.stroke();
        ctx.restore();
    },

    // Check text input answer
    checkTextAnswer() {
        const userAnswer = this.normalizeVietnameseText(quizInput);
        const correctAnswer = this.normalizeVietnameseText(currentQuestion.correct);
        
        if (userAnswer === correctAnswer) {
            this.triggerAnswerEffect('correct');
            // Correct answer
            if (currentGameMode === GAME_MODES.RANDOM_10) {
                Game10Questions.handleCorrectAnswer();
            } else {
                // Endless mode
                hasAnsweredCorrectly = true;
                currentScore += 10;
                // Update high score if needed
                if (currentScore > highScore) {
                    highScore = currentScore;
                    localStorage.setItem('gameHighScore', highScore.toString());
                }
                this.resetQuiz();
            }
        } else {
            this.triggerAnswerEffect('wrong');
            // Wrong answer
            if (currentGameMode === GAME_MODES.RANDOM_10) {
                Game10Questions.handleWrongAnswer();
            } else {
                // Endless mode
                GameEndless.handleWrongAnswer();
            }
        }
    },

    // Check multiple choice answer
    checkMultipleChoiceAnswer(selectedIndex) {
        if (selectedIndex === currentQuestion.correct) {
            this.triggerAnswerEffect('correct');
            // Correct answer
            if (currentGameMode === GAME_MODES.RANDOM_10) {
                Game10Questions.handleCorrectAnswer();
            } else {
                // Endless mode
                hasAnsweredCorrectly = true;
                currentScore += 10;
                // Update high score if needed
                if (currentScore > highScore) {
                    highScore = currentScore;
                    localStorage.setItem('gameHighScore', highScore.toString());
                }
                this.resetQuiz();
            }
        } else {
            this.triggerAnswerEffect('wrong');
            // Wrong answer
            if (currentGameMode === GAME_MODES.RANDOM_10) {
                Game10Questions.handleWrongAnswer();
            } else {
                // Endless mode
                GameEndless.handleWrongAnswer();
            }
        }
    },

    // Reset quiz state
    resetQuiz() {
        isQuizActive = false;
        isGamePaused = false;
        slowFactor = 1;
        currentQuestion = null;
        quizInput = '';
        lastQuizEnd = Date.now();
    },

    // Handle mouse move for hover cursor over answers/input
    handleMouseMove(e) {
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

        let isHover = false;

        if (currentQuestion.type === 'MC') {
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
                    isHover = true;
                }
            });
        } else if (currentQuestion.type === 'TI') {
            const inputBoxWidth = 400;
            const inputBoxHeight = 60;
            const inputBoxX = (config.width - inputBoxWidth) / 2;
            const inputBoxY = boxY + 200;

            if (adjustedX >= inputBoxX && adjustedX <= inputBoxX + inputBoxWidth &&
                adjustedY >= inputBoxY && adjustedY <= inputBoxY + inputBoxHeight) {
                isHover = true;
            }
        }

        config.canvas.style.cursor = isHover ? 'pointer' : 'default';
    },

    handleClick(e) {
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

        if (currentQuestion.type === 'MC') {
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
                    this.checkMultipleChoiceAnswer(index);
                }
            });
        } else if (currentQuestion.type === 'TI') {
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
    }
};

const GameOver = {
    // Draw game over screen
    draw() {
        // Duolingo-style gradient background
        const gradient = config.ctx.createLinearGradient(0, 0, config.width, config.height);
        gradient.addColorStop(0, '#6E656521');
        gradient.addColorStop(1, '#64646438');
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
        const startX = boxX + (boxWidth - buttonWidth) / 2;
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
    },

    // Handle game over input
    handleInput(e) {
        if (config.gameState !== 'gameOver') return;

        if (e.key === 'Enter' || e.key === ' ') {
            // Play again with same character
            this.restartGame();
        } else if (e.key === 'Escape') {
            // Go back to menu
            config.gameState = 'menu';
            Menu.loop();
        }
    },

    // Handle game over clicks
    handleClick(e) {
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

        const buttonWidth = 220;
        const buttonHeight = 80;
        const startX = boxX + (boxWidth - buttonWidth) / 2;
        const buttonY = boxY + boxHeight - 100;

        // Play Again button
        if (adjustedX >= startX && adjustedX <= startX + buttonWidth &&
            adjustedY >= buttonY && adjustedY <= buttonY + buttonHeight) {
            this.restartGame();
        }
    },

    // Restart game function
    restartGame() {
        window.location.reload();
    },

    // Game over loop
    loop() {
        if (config.gameState === 'gameOver') {
            this.draw();
            requestAnimationFrame(this.loop.bind(this));
        } else if (config.gameState === 'characterSelect') {
            document.removeEventListener('keydown', GameOver.handleInput.bind(GameOver));
            document.removeEventListener('click', GameOver.handleClick.bind(GameOver));
        } else if (config.gameState === 'playing') {
            document.removeEventListener('keydown', GameOver.handleInput.bind(GameOver));
            document.removeEventListener('click', GameOver.handleClick.bind(GameOver));
        }
    }
};