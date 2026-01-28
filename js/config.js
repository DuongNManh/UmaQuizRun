// Game Configuration and Constants
const config = {
    canvas: null,
    ctx: null,
    width: 1850,
    height: 1000,
    scale: 1,
    groundY: 0,
    gameState: 'loading'
};

// Game Modes
const GAME_MODES = {
    RANDOM_10: 'random10', // Random 10 questions mode
    ENDLESS: 'endless'     // Endless mode (current mode)
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

// Game constants
const QUIZ_TRIGGER_DISTANCE = 1100; // Distance from character to trigger quiz
const QUIZ_TIME_LIMIT = 10000; // 10 seconds default
const OBSTACLE_SPAWN_INTERVAL = 5000; // 5 seconds after quiz ends
const TARGET_FPS = 60;
const FIXED_TIME_STEP = 1000 / TARGET_FPS; // 16.67ms

// Global game state variables
let currentGameMode = GAME_MODES.ENDLESS;
let currentQuestion = null;
let quizTimer = 0;
let quizTimeLimitMs = QUIZ_TIME_LIMIT; // actual limit for current question
let isQuizActive = false;
let quizStartTime = 0;
let quizInput = '';
let isGamePaused = false;
let slowFactor = 1; // Normal speed
let obstacles = [];
let lastQuizEnd = 0;
let currentScore = 0;
let highScore = localStorage.getItem('gameHighScore') ? parseInt(localStorage.getItem('gameHighScore')) : 0;
let quizData = [];

// Game loop variables
let lastFrameTime = 0;
let deltaTime = 0;
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let hasAnsweredCorrectly = false; // Flag for correct answer
let hasAnsweredWrong = false; // Flag for wrong answer
let targetObstacle = null; // The obstacle to jump over

const SLOW_FACTOR_BY_DURATION = {
    5: 0.40,
    10: 0.20,
    15: 0.13,
    20: 0.10
};