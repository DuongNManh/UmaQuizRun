// Main game initialization

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
    
    // Save current transform
    config.ctx.save();
    config.ctx.setTransform(1, 0, 0, 1, 0, 0);
    config.ctx.scale(config.scale, config.scale);

    // Center the game
    const offsetX = (config.canvas.width / config.scale - config.width) / 2;
    const offsetY = (config.canvas.height / config.scale - config.height) / 2;
    config.ctx.translate(offsetX, offsetY);

    // Update relative positions
    config.groundY = config.height * 0.8;
    if (typeof characterConfig !== 'undefined') {
        characterConfig.y = config.groundY; // Reset to ground if not jumping
    }
}

// Start when page loads
window.addEventListener('load', init);
window.addEventListener('resize', resizeCanvas);