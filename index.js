// game state keeps track of everything
const gameState = {
    difficulty: 'easy',
    totalPairs: 3,
    timeLimit: 60,
    timeLeft: 60,
    clicks: 0,
    matchedPairs: 0,
    flippedCards: [],
    timerId: null,
    isProcessing: false,
    powerups: 3,
    gameActive: false
};

// all the html elements we need to work with
const elements = {
    gameGrid: document.getElementById('game-grid'),
    timer: document.getElementById('timer'),
    clicks: document.getElementById('clicks'),
    matched: document.getElementById('matched'),
    remaining: document.getElementById('remaining'),
    difficulty: document.getElementById('difficulty'),
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    themeBtn: document.getElementById('theme-btn'),
    powerupBtn: document.getElementById('powerup-btn')
};

// settings for each difficulty level
const difficultySettings = {
    easy: { pairs: 3, time: 20 },
    medium: { pairs: 5, time: 90 },
    hard: { pairs: 8, time: 120 }
};

// starts a new game
async function initializeGame() {
    gameState.gameActive = true;
    gameState.timeLeft = gameState.timeLimit;
    gameState.clicks = 0;
    gameState.matchedPairs = 0;
    gameState.flippedCards = [];
    gameState.powerups = 3;
    
    elements.gameGrid.innerHTML = '';
    updateGameStatus();
    
    const pokemonList = await fetchPokemon();
    generateCards(pokemonList);
    startTimer();
}

// gets pokemon data from the api
async function fetchPokemon() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
        const data = await response.json();
        const shuffled = data.results.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, gameState.totalPairs);
        
        const pokemonData = await Promise.all(selected.map(async (pokemon) => {
            const res = await fetch(pokemon.url);
            const details = await res.json();
            return {
                name: details.name,
                image: details.sprites.other['official-artwork'].front_default || 'default.png'
            };
        }));
        
        return pokemonData;
    } catch (error) {
        console.error('oops, error getting pokemon:', error);
        return [];
    }
}

// creates the card elements for the game
function generateCards(pokemonList) {
    const cards = pokemonList.flatMap(p => [p, p]); // make pairs
    cards.sort(() => Math.random() - 0.5); // shuffle
    
    cards.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <img class="front_face" src="${pokemon.image}" alt="${pokemon.name}">
            <img class="back_face" src="back.webp">
        `;
        card.addEventListener('click', handleCardClick);
        elements.gameGrid.appendChild(card);
    });
}

// what happens when you click a card
function handleCardClick() {
    if (!gameState.gameActive || 
        gameState.isProcessing || 
        this.classList.contains('flip') || 
        gameState.flippedCards.includes(this)) return;

    gameState.clicks++;
    this.classList.add('flip');
    gameState.flippedCards.push(this);

    if (gameState.flippedCards.length === 2) {
        gameState.isProcessing = true;
        checkMatch();
    }

    updateGameStatus();
}

// checks if two flipped cards match
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    const img1 = card1.querySelector('.front_face').src;
    const img2 = card2.querySelector('.front_face').src;

    if (img1 === img2) {
        gameState.matchedPairs++;
        card1.removeEventListener('click', handleCardClick);
        card2.removeEventListener('click', handleCardClick);
        checkWin();
    } else {
        setTimeout(() => {
            card1.classList.remove('flip');
            card2.classList.remove('flip');
        }, 1000);
    }

    setTimeout(() => {
        gameState.flippedCards = [];
        gameState.isProcessing = false;
    }, 1000);
}

// checks if player won
function checkWin() {
    if (gameState.matchedPairs === gameState.totalPairs) {
        endGame(true);
    }
}

// updates the score and timer display
function updateGameStatus() {
    elements.clicks.textContent = gameState.clicks;
    elements.matched.textContent = gameState.matchedPairs;
    elements.remaining.textContent = gameState.totalPairs - gameState.matchedPairs;
    elements.timer.textContent = gameState.timeLeft;
    elements.powerupBtn.textContent = `reveal cards (${gameState.powerups})`;
}

// starts the countdown timer
function startTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = setInterval(() => {
        gameState.timeLeft--;
        elements.timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

// ends the game with win/lose message
function endGame(won) {
    clearInterval(gameState.timerId);
    gameState.gameActive = false;
    elements.gameGrid.querySelectorAll('.memory-card').forEach(card => {
        card.removeEventListener('click', handleCardClick);
    });
    alert(won ? 'you won! nice job!' : 'time\'s up! game over');
}

// event listeners for buttons
elements.startBtn.addEventListener('click', initializeGame);
elements.resetBtn.addEventListener('click', initializeGame);

elements.difficulty.addEventListener('change', (e) => {
    const settings = difficultySettings[e.target.value];
    gameState.difficulty = e.target.value;
    gameState.totalPairs = settings.pairs;
    gameState.timeLimit = settings.time;
    initializeGame();
});

elements.themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    elements.themeBtn.textContent = document.body.classList.contains('dark-theme') 
        ? 'light theme' 
        : 'dark theme';
});

// powerup that shows all cards briefly
elements.powerupBtn.addEventListener('click', () => {
    if (gameState.powerups > 0 && gameState.gameActive) {
        gameState.powerups--;
        const cards = elements.gameGrid.querySelectorAll('.memory-card');
        
        cards.forEach(card => card.classList.add('flip'));
        setTimeout(() => {
            cards.forEach(card => {
                if (!card.classList.contains('flip')) return;
                card.classList.remove('flip');
            });
        }, 2000);
        
        updateGameStatus();
    }
});

// set up initial game settings when page loads
document.addEventListener('DOMContentLoaded', () => {
    const settings = difficultySettings[gameState.difficulty];
    gameState.totalPairs = settings.pairs;
    gameState.timeLimit = settings.time;
});

$(document).ready(function() {
    // Set initial theme
    $('#game-grid').addClass('light-mode');

    $('#theme-btn').click(function() {
        const $body = $('body');
        const $grid = $('#game-grid');
        if ($body.hasClass('light-theme')) {
            $body.removeClass('light-theme').addClass('dark-theme');
            $grid.removeClass('light-mode').addClass('dark-mode');
            $(this).text('Light Theme');
        } else {
            $body.removeClass('dark-theme').addClass('light-theme');
            $grid.removeClass('dark-mode').addClass('light-mode');
            $(this).text('Dark Theme');
        }
    });
});