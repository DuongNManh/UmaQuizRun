// Quiz and Game Over modules

const Quiz = {
    // Draw quiz UI
    draw() {
        if (!currentQuestion) return;

        // Semi-transparent overlay with Duolingo green
        config.ctx.fillStyle = 'rgba(0, 8, 2, 0.81)';
        config.ctx.fillRect(0, 0, config.width, config.height);

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
    },

    // Handle keyboard input for quiz
    handleKeyboard(e) {
        if (!isQuizActive || !currentQuestion) return;

        if (currentQuestion.type === 'text_input') {
            // Handle text input quiz
            if (e.key === 'Enter') {
                this.checkTextAnswer();
            } else if (e.key === 'Backspace') {
                quizInput = quizInput.slice(0, -1);
            } else if (e.key.length === 1) {
                quizInput += e.key;
            }
            e.preventDefault();
        }
        // Multiple choice is handled via mouse clicks only
    },

    // Check text input answer
    checkTextAnswer() {
        if (quizInput.trim().toLowerCase() === currentQuestion.correct.toLowerCase()) {
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
    checkMultipleChoiceAnswer(selectedOption) {
        if (selectedOption === currentQuestion.correct) {
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
                    this.checkMultipleChoiceAnswer(option);
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
    }
};

const GameOver = {
    // Draw game over screen
    draw() {
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